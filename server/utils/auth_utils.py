import jwt
import uuid
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, current_app, g
from models.db import db
from models.user import User, Role
from models.auth import ActiveSession
from utils.response import error_response
from utils.logger import log_audit

def generate_tokens(user_id, session_id=None):
    """Generates short-lived access token and long-lived refresh token."""
    jti = session_id if session_id else str(uuid.uuid4())
    
    access_payload = {
        'exp': datetime.now(timezone.utc) + timedelta(minutes=15),
        'iat': datetime.now(timezone.utc),
        'sub': user_id,
        'type': 'access',
        'jti': jti
    }
    
    refresh_payload = {
        'exp': datetime.now(timezone.utc) + timedelta(days=7),
        'iat': datetime.now(timezone.utc),
        'sub': user_id,
        'type': 'refresh',
        'jti': jti
    }
    
    access_token = jwt.encode(
        access_payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )
    
    refresh_token = jwt.encode(
        refresh_payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )
    
    return access_token, refresh_token, jti

def get_token_from_header():
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
    return None

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return error_response('Token is missing', status_code=401)
        
        try:
            payload = jwt.decode(token, current_app.config.get('SECRET_KEY'), algorithms=['HS256'])
            if payload.get('type') != 'access':
                return error_response('Invalid token type', status_code=401)
                
            current_user = db.session.get(User, payload['sub'])
            if not current_user:
                return error_response('User not found', status_code=401)
            
            if current_user.status != 'Active':
                return error_response('User account is not active', status_code=403)
            
            # Check if session is revoked
            jti = payload.get('jti')
            if jti:
                session = ActiveSession.query.filter_by(session_token=jti, user_id=current_user.id).first()
                if not session or session.revoked_at:
                    return error_response('Session revoked or invalid', status_code=401)
                
            g.user = current_user
            g.session_jti = jti
        except jwt.ExpiredSignatureError:
            return error_response('Token has expired', status_code=401)
        except jwt.InvalidTokenError:
            return error_response('Invalid token', status_code=401)
            
        return f(*args, **kwargs)
    return decorated_function

def jwt_refresh_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()
        
        if not token:
            return error_response('Refresh token is missing', status_code=401)
            
        try:
            payload = jwt.decode(token, current_app.config.get('SECRET_KEY'), algorithms=['HS256'])
            if payload.get('type') != 'refresh':
                return error_response('Invalid token type', status_code=401)
                
            current_user = db.session.get(User, payload['sub'])
            if not current_user:
                return error_response('User not found', status_code=401)
                
            if current_user.status != 'Active':
                return error_response('User account is not active', status_code=403)
                
            # Verify session in DB
            jti = payload.get('jti')
            session = ActiveSession.query.filter_by(session_token=jti, user_id=current_user.id).first()
            if not session or session.revoked_at:
                return error_response('Session revoked or invalid', status_code=401)
                
            g.user = current_user
            g.session_jti = jti
            g.session = session
        except jwt.ExpiredSignatureError:
            return error_response('Refresh token has expired', status_code=401)
        except jwt.InvalidTokenError:
            return error_response('Invalid refresh token', status_code=401)
            
        return f(*args, **kwargs)
    return decorated_function

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'user'):
                return error_response('Authentication required', status_code=401)
            
            user_role = g.user.role_ref.name
            if user_role == 'Super Admin' or user_role in roles:
                return f(*args, **kwargs)
                
            log_audit('PERMISSION_DENIED', f"User {g.user.username} ({user_role}) attempted to access a restricted resource.", "FAILURE")
            return error_response('Insufficient permissions', status_code=403)
        return decorated_function
    return decorator
