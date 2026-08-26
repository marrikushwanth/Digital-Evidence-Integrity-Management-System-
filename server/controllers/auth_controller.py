import bcrypt
from flask import g
from models.db import db
from models.user import User, Role
from utils.response import success_response, error_response
from utils.auth_utils import generate_token
from utils.validators import is_valid_email
from utils.logger import log_audit

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
    
    log_audit('REGISTER', f"New registration submitted for {new_user.username}", "SUCCESS")
    
    return success_response('Registration successful, pending approval', status_code=201)

def login_user(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'username' not in data or 'password' not in data:
        return error_response('Username and password required', status_code=422)
        
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password_hash.encode('utf-8')):
        log_audit('LOGIN_FAILED', f"Failed login attempt for {data.get('username')}", "FAILURE")
        return error_response('Invalid credentials', status_code=401)
        
    if user.status == 'Pending Approval':
        return error_response('Account pending approval', status_code=403)
        
    if user.status == 'Suspended':
        return error_response('Account suspended', status_code=403)
        
    token = generate_token(user.id)
    g.user = user
    log_audit('LOGIN', f"User {user.username} authenticated successfully.", "SUCCESS")
    
    return success_response('Login successful', {
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name,
            'role': user.role_ref.name,
            'status': user.status
        }
    })

def logout_user():
    log_audit('LOGOUT', "User ended session.", "SUCCESS")
    return success_response('Logout successful')

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
        
    user.password_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()
    
    log_audit('CHANGE_PASSWORD', f"User {user.username} changed their password.", "SUCCESS")
    return success_response('Password updated successfully')
