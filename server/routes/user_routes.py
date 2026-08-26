from flask import Blueprint, request
from controllers import user_controller
from utils.auth_utils import jwt_required, role_required

user_bp = Blueprint('users', __name__, url_prefix='/api/users')

@user_bp.route('/', methods=['GET'])
@jwt_required
@role_required(['Admin', 'Auditor'])
def get_users():
    return user_controller.get_users(request)

@user_bp.route('/', methods=['POST'])
@jwt_required
@role_required(['Admin'])
def create_user():
    return user_controller.create_user(request)

@user_bp.route('/<user_id>', methods=['GET'])
@jwt_required
@role_required(['Admin', 'Auditor'])
def get_user(user_id):
    return user_controller.get_user(user_id)

@user_bp.route('/<user_id>', methods=['PUT'])
@jwt_required
@role_required(['Admin'])
def update_user(user_id):
    return user_controller.update_user(user_id, request)

@user_bp.route('/<user_id>/reset-password', methods=['PATCH'])
@jwt_required
@role_required(['Admin'])
def admin_reset_password(user_id):
    return user_controller.admin_reset_password(user_id, request)

@user_bp.route('/<user_id>/approve', methods=['PATCH'])
@jwt_required
@role_required(['Admin'])
def approve_user(user_id):
    return user_controller.approve_user(user_id)

@user_bp.route('/<user_id>/reject', methods=['PATCH'])
@jwt_required
@role_required(['Admin'])
def reject_user(user_id):
    return user_controller.reject_user(user_id)

@user_bp.route('/<user_id>/role', methods=['PATCH'])
@jwt_required
@role_required(['Admin'])
def assign_role(user_id):
    return user_controller.assign_role(user_id, request)

@user_bp.route('/<user_id>/status', methods=['PATCH'])
@jwt_required
@role_required(['Admin'])
def change_status(user_id):
    return user_controller.change_status(user_id, request)

@user_bp.route('/<user_id>', methods=['DELETE'])
@jwt_required
@role_required(['Admin'])
def delete_user(user_id):
    return user_controller.delete_user(user_id)
