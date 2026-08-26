from flask import Blueprint, request
from controllers import log_controller
from utils.auth_utils import jwt_required, role_required

log_bp = Blueprint('logs', __name__, url_prefix='/api/logs')

@log_bp.route('/audit', methods=['GET'])
@jwt_required
@role_required(['Admin', 'Auditor'])
def get_audit_logs():
    return log_controller.get_audit_logs(request)

@log_bp.route('/chain-of-custody', methods=['GET'])
@jwt_required
def get_chain_of_custody():
    return log_controller.get_chain_of_custody(request)
