import bcrypt
import pyotp
import qrcode
import io
import base64
import secrets
import hashlib
from datetime import datetime, timedelta
from flask import g, request
from models.db import db
from models.user import User, Role
from models.auth import PasswordHistory, ActiveSession, ResetToken, RecoveryCode
from utils.response import success_response, error_response
from utils.auth_utils import generate_tokens
from utils.validators import is_valid_email
from utils.logger import log_audit
from utils.notifier import send_security_notification
from services.crypto_service import CryptoService

MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
PASSWORD_EXPIRY_DAYS = 90

def check_password_complexity(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not any(char.isdigit() for char in password):
        return False, "Password must contain at least one number."
    if not any(char.isupper() for char in password):
        return False, "Password must contain at least one uppercase letter."
    if not any(char.islower() for char in password):
        return False, "Password must contain at least one lowercase letter."
    return True, ""

def register_user(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    required = ['username', 'email', 'password', 'full_name']
    if not all(k in data for k in required):
        return error_response(f'Missing required fields: {", ".join([k for k in required if k not in data])}', status_code=422)
        
    if not is_valid_email(data['email']):
        return error_response('Invalid email format', status_code=422)
        
    if User.query.filter_by(username=data['username']).first():
        return error_response('Username already exists', status_code=409)
        
    if User.query.filter_by(email=data['email']).first():
        return error_response('Email already exists', status_code=409)
        
    valid, msg = check_password_complexity(data['password'])
    if not valid:
        return error_response(msg, status_code=400)
        
    viewer_role = Role.query.filter_by(name='Viewer').first()
    if not viewer_role:
        return error_response('Default role not configured', status_code=500)
        
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        full_name=data['full_name'],
        department=data.get('department'),
        organization=data.get('organization'),
        badge_number=data.get('badge_number'),
        phone=data.get('phone'),
        role_id=viewer_role.id
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Store initial password in history
    hist = PasswordHistory(user_id=new_user.id, password_hash=hashed_password)
    db.session.add(hist)
    db.session.commit()
    
    log_audit('REGISTER', f"New registration submitted for {new_user.username}", "SUCCESS")
    
    return success_response('Registration successful, pending approval', status_code=201)

def login_user(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'username' not in data or 'password' not in data:
        return error_response('Username and password required', status_code=422)
        
    user = User.query.filter_by(username=data['username']).first()
    
    if not user:
        # Don't reveal user existence
        log_audit('LOGIN_FAILED', f"Failed login attempt for {data.get('username')}", "FAILURE")
        return error_response('Invalid credentials', status_code=401)

    if user.locked_until and user.locked_until > datetime.utcnow():
        log_audit('LOGIN_FAILED', f"Login attempt on locked account {user.username}", "FAILURE")
        return error_response('Account temporarily locked. Try again later.', status_code=423)
        
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            log_audit('ACCOUNT_LOCKED', f"Account locked for {user.username} after {MAX_LOGIN_ATTEMPTS} failed attempts.", "SUCCESS")
            send_security_notification(user, 'Account Locked', {'reason': 'Too many failed login attempts', 'duration_minutes': LOCKOUT_DURATION_MINUTES})
        db.session.commit()
        log_audit('LOGIN_FAILED', f"Failed login attempt for {user.username}", "FAILURE")
        return error_response('Invalid credentials', status_code=401)
        
    user.failed_login_attempts = 0
    user.locked_until = None
    db.session.commit()
    
    if user.status == 'Pending Approval':
        return error_response('Account pending approval', status_code=403)
        
    if user.status == 'Suspended':
        return error_response('Account suspended', status_code=403)
        
    if user.password_changed_at and user.password_changed_at < datetime.utcnow() - timedelta(days=PASSWORD_EXPIRY_DAYS):
        return success_response('Password expired', {'password_expired': True, 'temp_user_id': user.id})
        
    if user.mfa_enabled:
        return success_response('MFA required', {'mfa_required': True, 'temp_user_id': user.id})
        
    return complete_login(user, request)

def complete_login(user, request):
    access_token, refresh_token, jti = generate_tokens(user.id)
    
    ip_addr = request.remote_addr if request else '127.0.0.1'
    ua = request.user_agent.string if request else 'Unknown'
    platform = request.user_agent.platform if request else 'Unknown'
    
    # Suspicious Login Check
    previous_session = ActiveSession.query.filter_by(user_id=user.id, ip_address=ip_addr).first()
    if not previous_session:
        # We spoof g.user here for log_audit because it may not be set in MFA flow yet
        g.user = user
        log_audit('SUSPICIOUS_LOGIN', f"Login from new IP address: {ip_addr}", "WARNING")
        send_security_notification(user, 'New Device/IP Login', {'ip_address': ip_addr, 'device': platform})
    
    session = ActiveSession(
        user_id=user.id,
        session_token=jti,
        ip_address=ip_addr,
        user_agent=ua,
        device_info=platform,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.session.add(session)
    db.session.commit()
    
    # We spoof g.user here for log_audit because it may not be set in MFA flow yet
    g.user = user
    log_audit('LOGIN_SUCCESS', f"User {user.username} authenticated successfully.", "SUCCESS")
    
    return success_response('Login successful', {
        'token': access_token,
        'refresh_token': refresh_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'role': user.role_ref.name,
            'status': user.status,
            'mfa_enabled': user.mfa_enabled
        }
    })

def verify_mfa_login(request):
    data = request.get_json()
    if 'temp_user_id' not in data or 'token' not in data:
        return error_response('Missing parameters', status_code=400)
        
    user = User.query.get(data['temp_user_id'])
    if not user or not user.mfa_enabled:
        return error_response('Invalid request', status_code=400)
        
    try:
        decrypted_secret = CryptoService.decrypt_data(user.mfa_secret.encode('utf-8'))
        totp = pyotp.TOTP(decrypted_secret)
        
        # Check standard TOTP
        if totp.verify(data['token']):
            return complete_login(user, request)
            
        # Check if token is a recovery code
        token_hash = hashlib.sha256(data['token'].encode('utf-8')).hexdigest()
        recovery = RecoveryCode.query.filter_by(user_id=user.id, code_hash=token_hash, used=False).first()
        if recovery:
            recovery.used = True
            recovery.used_at = datetime.utcnow()
            db.session.commit()
            log_audit('MFA_RECOVERY_USED', f"User {user.username} logged in using a recovery code.", "SUCCESS")
            send_security_notification(user, 'Recovery Code Used', {'message': 'A recovery code was used to login.'})
            return complete_login(user, request)
            
        # Both failed
        g.user = user
        log_audit('MFA_FAILED', f"Failed MFA attempt for {user.username}", "FAILURE")
        return error_response('Invalid MFA code', status_code=401)
        
    except Exception as e:
        return error_response('Server error during MFA verification', status_code=500)

def refresh_token(request):
    # This endpoint is protected by jwt_refresh_required which sets g.user and g.session
    if not hasattr(g, 'user') or not hasattr(g, 'session'):
        return error_response('Unauthorized', status_code=401)
        
    user = g.user
    session = g.session
    
    # Issue new access token only
    import jwt
    import uuid
    from flask import current_app
    
    access_payload = {
        'exp': datetime.utcnow() + timedelta(minutes=15),
        'iat': datetime.utcnow(),
        'sub': user.id,
        'type': 'access',
        'jti': session.session_token
    }
    
    access_token = jwt.encode(
        access_payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )
    
    session.last_used_at = datetime.utcnow()
    db.session.commit()
    
    return success_response('Token refreshed', {
        'token': access_token
    })

def logout_user():
    if hasattr(g, 'session'):
        g.session.revoked_at = datetime.utcnow()
        db.session.commit()
        log_audit('SESSION_REVOKED', "User ended session.", "SUCCESS")
    return success_response('Logout successful')
    
def logout_all_sessions():
    sessions = ActiveSession.query.filter_by(user_id=g.user.id, revoked_at=None).all()
    for s in sessions:
        s.revoked_at = datetime.utcnow()
    db.session.commit()
    log_audit('LOGOUT_ALL', "User revoked all active sessions.", "SUCCESS")
    return success_response('All sessions revoked')

def get_active_sessions():
    sessions = ActiveSession.query.filter_by(user_id=g.user.id, revoked_at=None).all()
    res = []
    for s in sessions:
        res.append({
            'id': s.id,
            'ip_address': s.ip_address,
            'user_agent': s.user_agent,
            'device_info': s.device_info,
            'created_at': s.created_at.isoformat(),
            'last_used_at': s.last_used_at.isoformat(),
            'current': getattr(g, 'session_jti', None) == s.session_token
        })
    return success_response('Active sessions retrieved', {'sessions': res})

def revoke_session(session_id):
    session = ActiveSession.query.filter_by(id=session_id, user_id=g.user.id, revoked_at=None).first()
    if not session:
        return error_response('Session not found or already revoked', status_code=404)
        
    session.revoked_at = datetime.utcnow()
    db.session.commit()
    log_audit('SESSION_REVOKED', f"User revoked session {session_id}.", "SUCCESS")
    return success_response('Session revoked successfully')

def get_profile():
    user = g.user
    return success_response('Profile retrieved', {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'department': user.department,
        'organization': getattr(user, 'organization', None),
        'phone': getattr(user, 'phone', None),
        'badge_number': user.badge_number,
        'role': user.role_ref.name,
        'status': user.status,
        'mfa_enabled': user.mfa_enabled,
        'created_at': user.created_at.isoformat()
    })
    
def change_password(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'old_password' not in data or 'new_password' not in data:
        return error_response('Missing old or new password', status_code=422)
        
    user = g.user
    if not bcrypt.checkpw(data['old_password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return error_response('Invalid old password', status_code=400)
        
    valid, msg = check_password_complexity(data['new_password'])
    if not valid:
        return error_response(msg, status_code=400)
        
    # Check history (last 5 passwords)
    histories = PasswordHistory.query.filter_by(user_id=user.id).order_by(PasswordHistory.created_at.desc()).limit(5).all()
    for hist in histories:
        if bcrypt.checkpw(data['new_password'].encode('utf-8'), hist.password_hash.encode('utf-8')):
            return error_response('Cannot reuse a recently used password', status_code=400)
            
    hashed = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = hashed
    user.password_changed_at = datetime.utcnow()
    
    new_hist = PasswordHistory(user_id=user.id, password_hash=hashed)
    db.session.add(new_hist)
    db.session.commit()
    
    log_audit('PASSWORD_CHANGED', f"User {user.username} changed their password.", "SUCCESS")
    send_security_notification(user, 'Password Changed', {'status': 'Success'})
    return success_response('Password updated successfully')

def request_password_reset(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'email' not in data:
        return error_response('Email required', status_code=422)
        
    user = User.query.filter_by(email=data['email']).first()
    # Always return success to prevent email enumeration
    if not user:
        return success_response('If an account exists with that email, a reset link will be sent.')
        
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    
    rt = ResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.session.add(rt)
    db.session.commit()
    
    reset_link = f"http://localhost:5173/reset-password?token={token}"
    log_audit('PASSWORD_RESET_REQUESTED', f"Password reset requested for {user.username}", "SUCCESS")
    send_security_notification(user, 'Password Reset Requested', {'reset_link': reset_link, 'expires_in': '15 minutes'})
    
    return success_response('If an account exists with that email, a reset link will be sent.')

def verify_reset_token(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'token' not in data:
        return error_response('Token required', status_code=422)
        
    token_hash = hashlib.sha256(data['token'].encode('utf-8')).hexdigest()
    rt = ResetToken.query.filter_by(token_hash=token_hash, used=False).first()
    
    if not rt or rt.expires_at < datetime.utcnow():
        return error_response('Invalid or expired token', status_code=400)
        
    return success_response('Token is valid')

def complete_password_reset(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'token' not in data or 'new_password' not in data:
        return error_response('Token and new_password required', status_code=422)
        
    token_hash = hashlib.sha256(data['token'].encode('utf-8')).hexdigest()
    rt = ResetToken.query.filter_by(token_hash=token_hash, used=False).first()
    
    if not rt or rt.expires_at < datetime.utcnow():
        return error_response('Invalid or expired token', status_code=400)
        
    user = User.query.get(rt.user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    valid, msg = check_password_complexity(data['new_password'])
    if not valid:
        return error_response(msg, status_code=400)
        
    histories = PasswordHistory.query.filter_by(user_id=user.id).order_by(PasswordHistory.created_at.desc()).limit(5).all()
    for hist in histories:
        if bcrypt.checkpw(data['new_password'].encode('utf-8'), hist.password_hash.encode('utf-8')):
            return error_response('Cannot reuse a recently used password', status_code=400)
            
    hashed = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password_hash = hashed
    user.password_changed_at = datetime.utcnow()
    user.failed_login_attempts = 0
    user.locked_until = None
    
    rt.used = True
    
    new_hist = PasswordHistory(user_id=user.id, password_hash=hashed)
    db.session.add(new_hist)
    
    # Invalidate all active sessions
    sessions = ActiveSession.query.filter_by(user_id=user.id, revoked_at=None).all()
    for s in sessions:
        s.revoked_at = datetime.utcnow()
        
    db.session.commit()
    
    # Use spoofed g.user for logger/notifier since we aren't in a JWT context
    g.user = user
    log_audit('PASSWORD_RESET_COMPLETED', f"Password reset successfully for {user.username}", "SUCCESS")
    send_security_notification(user, 'Password Reset Completed', {'status': 'Success', 'action_required': 'If you did not do this, contact admin immediately.'})
    
    return success_response('Password reset successfully')

# MFA Setup
def setup_mfa():
    user = g.user
    if user.mfa_enabled:
        return error_response('MFA already enabled', status_code=400)
        
    secret = pyotp.random_base32()
    # encrypt secret before saving
    enc_secret = CryptoService.encrypt_data(secret).decode('utf-8')
    
    user.mfa_secret = enc_secret
    db.session.commit()
    
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="DEIMS")
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    return success_response('MFA setup initialized', {
        'secret': secret,
        'qr_code': f"data:image/png;base64,{img_str}"
    })

def verify_setup_mfa(request):
    data = request.get_json()
    if 'token' not in data:
        return error_response('Token required', status_code=400)
        
    user = g.user
    if user.mfa_enabled:
        return error_response('MFA already enabled', status_code=400)
        
    if not user.mfa_secret:
        return error_response('MFA setup not initialized', status_code=400)
        
    decrypted_secret = CryptoService.decrypt_data(user.mfa_secret.encode('utf-8'))
    totp = pyotp.TOTP(decrypted_secret)
    if totp.verify(data['token']):
        user.mfa_enabled = True
        
        # Generate initial recovery codes
        codes = []
        for _ in range(8):
            code = secrets.token_hex(5) # 10 characters
            codes.append(code)
            code_hash = hashlib.sha256(code.encode('utf-8')).hexdigest()
            db.session.add(RecoveryCode(user_id=user.id, code_hash=code_hash))
            
        db.session.commit()
        log_audit('MFA_ENABLED', f"User {user.username} enabled MFA.", "SUCCESS")
        send_security_notification(user, 'MFA Enabled', {'status': 'Success'})
        return success_response('MFA enabled successfully', {'recovery_codes': codes})
        
    return error_response('Invalid code', status_code=400)

def regenerate_recovery_codes(request):
    user = g.user
    if not user.mfa_enabled:
        return error_response('MFA is not enabled', status_code=400)
        
    data = request.get_json()
    if 'password' not in data:
        return error_response('Password required', status_code=400)
        
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return error_response('Invalid password', status_code=401)
        
    # Invalidate old codes
    RecoveryCode.query.filter_by(user_id=user.id).delete()
    
    # Generate new codes
    codes = []
    for _ in range(8):
        code = secrets.token_hex(5)
        codes.append(code)
        code_hash = hashlib.sha256(code.encode('utf-8')).hexdigest()
        db.session.add(RecoveryCode(user_id=user.id, code_hash=code_hash))
        
    db.session.commit()
    log_audit('MFA_RECOVERY_REGENERATED', f"User {user.username} regenerated MFA recovery codes.", "SUCCESS")
    send_security_notification(user, 'Recovery Codes Regenerated', {'status': 'Success'})
    
    return success_response('Recovery codes regenerated', {'recovery_codes': codes})

def disable_mfa(request):
    data = request.get_json()
    if 'password' not in data:
        return error_response('Password required to disable MFA', status_code=400)
        
    user = g.user
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        return error_response('Invalid password', status_code=401)
        
    user.mfa_enabled = False
    user.mfa_secret = None
    db.session.commit()
    log_audit('MFA_DISABLED', f"User {user.username} disabled MFA.", "SUCCESS")
    send_security_notification(user, 'MFA Disabled', {'status': 'Warning'})
    return success_response('MFA disabled successfully')
