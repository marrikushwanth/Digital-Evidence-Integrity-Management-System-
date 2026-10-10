from flask import Blueprint
from controllers import security_controller
from utils.auth_utils import jwt_required, role_required

security_bp = Blueprint('security', __name__, url_prefix='/api/security')

@security_bp.route('/events', methods=['POST'])
def log_client_event():
    return security_controller.log_client_event()

@security_bp.route('/dashboard', methods=['GET'])
@jwt_required
@role_required(['Super Admin', 'Admin', 'Security'])
def get_dashboard_stats():
    return security_controller.get_dashboard_stats()

@security_bp.route('/events', methods=['GET'])
@jwt_required
@role_required(['Super Admin', 'Admin', 'Security'])
def get_security_events():
    return security_controller.get_security_events()
