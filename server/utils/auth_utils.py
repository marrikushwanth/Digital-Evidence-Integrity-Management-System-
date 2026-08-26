import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, current_app, g
from models.user import User, Role
from utils.response import error_response
from utils.logger import log_audit

def generate_token(user_id):
    payload = {
        'exp': datetime.utcnow() + timedelta(days=1),
        'iat': datetime.utcnow(),
        'sub': user_id
    }
    return jwt.encode(
        payload,
        current_app.config.get('SECRET_KEY'),
        algorithm='HS256'
    )

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return error_response('Token is missing', status_code=401)
        
        try:
            payload = jwt.decode(token, current_app.config.get('SECRET_KEY'), algorithms=['HS256'])
            current_user = User.query.get(payload['sub'])
            if not current_user:
                return error_response('User not found', status_code=401)
            
            if current_user.status != 'Active':
                return error_response('User account is not active', status_code=403)
                
            g.user = current_user
        except jwt.ExpiredSignatureError:
            return error_response('Token has expired', status_code=401)
        except jwt.InvalidTokenError:
            return error_response('Invalid token', status_code=401)
            
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
