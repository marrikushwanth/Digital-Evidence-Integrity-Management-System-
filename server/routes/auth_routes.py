from flask import Blueprint, request
from controllers import auth_controller
from utils.auth_utils import jwt_required, jwt_refresh_required
from extensions import limiter

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    return auth_controller.register_user(request)

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    return auth_controller.login_user(request)

@auth_bp.route('/logout', methods=['POST'])
@jwt_required
def logout():
    return auth_controller.logout_user()

@auth_bp.route('/profile', methods=['GET'])
@jwt_required
def profile():
    return auth_controller.get_profile()
    
@auth_bp.route('/change-password', methods=['PATCH'])
@jwt_required
def change_password():
    return auth_controller.change_password(request)

@auth_bp.route('/password-reset/request', methods=['POST'])
@limiter.limit("3 per minute")
def request_password_reset():
    return auth_controller.request_password_reset(request)

@auth_bp.route('/password-reset/verify', methods=['POST'])
@limiter.limit("5 per minute")
def verify_reset_token():
    return auth_controller.verify_reset_token(request)

@auth_bp.route('/password-reset/complete', methods=['POST'])
@limiter.limit("3 per minute")
def complete_password_reset():
    return auth_controller.complete_password_reset(request)

# MFA Endpoints
@auth_bp.route('/mfa/setup', methods=['POST'])
@jwt_required
def setup_mfa():
    return auth_controller.setup_mfa()

@auth_bp.route('/mfa/verify-setup', methods=['POST'])
@jwt_required
def verify_setup_mfa():
    return auth_controller.verify_setup_mfa(request)

@auth_bp.route('/mfa/disable', methods=['POST'])
@jwt_required
def disable_mfa():
    return auth_controller.disable_mfa(request)

@auth_bp.route('/mfa/recovery-codes/regenerate', methods=['POST'])
@jwt_required
def regenerate_recovery_codes():
    return auth_controller.regenerate_recovery_codes(request)

@auth_bp.route('/mfa/verify', methods=['POST'])
@limiter.limit("5 per minute")
def verify_mfa():
    return auth_controller.verify_mfa_login(request)

# Session Management
@auth_bp.route('/refresh', methods=['POST'])
@jwt_refresh_required
def refresh():
    return auth_controller.refresh_token(request)

@auth_bp.route('/sessions', methods=['GET'])
@jwt_required
def get_sessions():
    return auth_controller.get_active_sessions()

@auth_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required
def revoke_session(session_id):
    return auth_controller.revoke_session(session_id)

@auth_bp.route('/logout-all', methods=['POST'])
@jwt_required
def logout_all():
    return auth_controller.logout_all_sessions()
