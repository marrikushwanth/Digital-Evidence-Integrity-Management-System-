from flask import g
import bcrypt
from sqlalchemy import or_
from models.db import db
from models.user import User, Role
from utils.response import success_response, error_response
from utils.validators import is_valid_email
from utils.logger import log_audit, log_chain_of_custody
from utils.notifier import send_security_notification

def get_users(request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 50, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    role = request.args.get('role', '')
    sort_by = request.args.get('sort', 'created_at')
    order = request.args.get('order', 'desc')
    
    query = User.query
    
    if search:
        query = query.filter(or_(
            User.username.ilike(f'%{search}%'),
            User.full_name.ilike(f'%{search}%'),
            User.email.ilike(f'%{search}%')
        ))
        
    if status:
        query = query.filter(User.status == status)
        
    if role:
        r = Role.query.filter_by(name=role).first()
        if r:
            query = query.filter(User.role_id == r.id)
            
    if order == 'desc':
        query = query.order_by(getattr(User, sort_by).desc())
    else:
        query = query.order_by(getattr(User, sort_by).asc())
        
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    data = []
    for u in pagination.items:
        data.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'full_name': u.full_name,
            'department': u.department,
            'organization': u.organization,
            'phone': u.phone,
            'role': u.role_ref.name,
            'status': u.status,
            'created_at': u.created_at.isoformat()
        })
        
    return success_response('Users retrieved', {
        'items': data,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    })

def create_user(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    required = ['username', 'email', 'password', 'full_name', 'role']
    if not all(k in data for k in required):
        return error_response('Missing required fields', status_code=422)
        
    if not is_valid_email(data['email']):
        return error_response('Invalid email format', status_code=422)
        
    if User.query.filter_by(username=data['username']).first() or User.query.filter_by(email=data['email']).first():
        return error_response('Username or email already exists', status_code=409)
        
    role = Role.query.filter_by(name=data['role']).first()
    if not role:
        return error_response('Invalid role', status_code=400)
        
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        full_name=data['full_name'],
        department=data.get('department'),
        organization=data.get('organization'),
        phone=data.get('phone'),
        role_id=role.id,
        status='Active' # Admin created users are active by default
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    log_audit('CREATE_USER', f"Admin created user {new_user.username}", "SUCCESS")
    return success_response('User created successfully', status_code=201)

def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    return success_response('User retrieved', {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'department': user.department,
        'organization': user.organization,
        'phone': user.phone,
        'role': user.role_ref.name,
        'status': user.status,
        'created_at': user.created_at.isoformat()
    })

def update_user(user_id, request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    data = request.get_json()
    if 'full_name' in data: user.full_name = data['full_name']
    if 'department' in data: user.department = data['department']
    if 'organization' in data: user.organization = data['organization']
    if 'phone' in data: user.phone = data['phone']
    if 'email' in data:
        if user.email != data['email'] and User.query.filter_by(email=data['email']).first():
            return error_response('Email already exists', status_code=409)
        user.email = data['email']
        
    db.session.commit()
    log_audit('EDIT_USER', f"Admin updated user {user.username}")
    return success_response('User updated successfully')

def admin_reset_password(user_id, request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    data = request.get_json()
    if 'new_password' not in data:
        return error_response('Missing new_password', status_code=422)
        
    user.password_hash = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.session.commit()
    
    log_audit('ADMIN_RESET_PASSWORD', f"Admin reset password for user {user.username}")
    return success_response('Password reset successfully')

def approve_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    user.status = 'Active'
    db.session.commit()
    log_audit('APPROVE_USER', f"Approved registration for {user.username}")
    log_chain_of_custody("SYSTEM", "SYSTEM", "User Approved", status="SUCCESS")
    return success_response('User approved')

def reject_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    username = user.username
    db.session.delete(user)
    db.session.commit()
    log_audit('REJECT_USER', f"Rejected registration for {username}")
    return success_response('User registration rejected and deleted')

def assign_role(user_id, request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'role' not in data:
        return error_response('Missing role', status_code=422)
        
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    role = Role.query.filter_by(name=data['role']).first()
    if not role:
        return error_response('Invalid role', status_code=400)
        
    user.role_id = role.id
    db.session.commit()
    log_audit('ROLE_CHANGED', f"Assigned role {role.name} to {user.username}")
    send_security_notification(user, 'Role Changed', {'new_role': role.name})
    return success_response('Role assigned successfully')

def change_status(user_id, request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    if 'status' not in data:
        return error_response('Missing status', status_code=422)
        
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    if data['status'] not in ['Active', 'Suspended']:
        return error_response('Invalid status', status_code=400)
        
    user.status = data['status']
    db.session.commit()
    log_audit('UPDATE_USER_STATUS', f"Changed status of {user.username} to {user.status}")
    
    if user.status == 'Suspended':
        log_chain_of_custody("SYSTEM", "SYSTEM", "User Suspended", status="SUCCESS")
    elif user.status == 'Active':
        log_chain_of_custody("SYSTEM", "SYSTEM", "User Activated", status="SUCCESS")
        
    return success_response('User status updated')

def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    username = user.username
    db.session.delete(user)
    db.session.commit()
    log_audit('DELETE_USER', f"Deleted user {username}")
    return success_response('User deleted successfully')
    
def unlock_account(user_id):
    user = User.query.get(user_id)
    if not user:
        return error_response('User not found', status_code=404)
        
    user.locked_until = None
    user.failed_login_attempts = 0
    db.session.commit()
    
    admin_name = g.user.username if hasattr(g, 'user') else 'SYSTEM'
    log_audit('ACCOUNT_UNLOCKED', f"Admin {admin_name} unlocked user {user.username}")
    send_security_notification(user, 'Account Unlocked', {'unlocked_by': admin_name})
    return success_response('User account unlocked successfully')

def update_preferences(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json()
    user = g.user
    
    if 'email_notifications_enabled' in data:
        user.email_notifications_enabled = data['email_notifications_enabled']
        
    db.session.commit()
    return success_response('Preferences updated successfully')
