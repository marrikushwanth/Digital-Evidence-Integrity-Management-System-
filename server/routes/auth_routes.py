from flask import Blueprint, request
from controllers import auth_controller
from utils.auth_utils import jwt_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    return auth_controller.register_user(request)

@auth_bp.route('/login', methods=['POST'])
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
