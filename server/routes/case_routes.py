from flask import Blueprint, request
from controllers import case_controller
from utils.auth_utils import jwt_required, role_required

case_bp = Blueprint('cases', __name__, url_prefix='/api/cases')

@case_bp.route('/', methods=['POST'])
@jwt_required
@role_required(['Admin', 'Investigator'])
def create_case():
    return case_controller.create_case(request)

@case_bp.route('/', methods=['GET'])
@jwt_required
def get_cases():
    return case_controller.get_cases(request)

@case_bp.route('/<case_id>', methods=['GET'])
@jwt_required
def get_case(case_id):
    return case_controller.get_case(case_id)

@case_bp.route('/<case_id>', methods=['PUT'])
@jwt_required
@role_required(['Admin', 'Investigator', 'Editor'])
def update_case(case_id):
    return case_controller.update_case(case_id, request)

@case_bp.route('/<case_id>/status', methods=['PATCH'])
@jwt_required
@role_required(['Admin', 'Investigator'])
def change_case_status(case_id):
    return case_controller.change_case_status(case_id, request)

@case_bp.route('/<case_id>', methods=['DELETE'])
@jwt_required
@role_required(['Admin'])
def delete_case(case_id):
    return case_controller.delete_case(case_id)
