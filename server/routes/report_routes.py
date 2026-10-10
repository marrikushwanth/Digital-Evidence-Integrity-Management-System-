from flask import Blueprint
from controllers import report_controller
from utils.auth_utils import jwt_required, role_required

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@report_bp.route('/generate', methods=['POST'])
@report_bp.route('/generate/<case_id>', methods=['POST'])
@jwt_required
@role_required(['Admin', 'Investigator', 'Auditor'])
def generate_report(case_id=None):
    return report_controller.generate_report(case_id)

@report_bp.route('/<report_id>/download', methods=['GET'])
@jwt_required
def download_report(report_id):
    return report_controller.download_report(report_id)

@report_bp.route('/', methods=['GET'])
@jwt_required
def get_reports():
    return report_controller.get_reports()

@report_bp.route('/cases/<case_id>/pdf', methods=['GET'])
@jwt_required
def get_case_forensic_report_pdf(case_id):
    return report_controller.generate_case_forensic_report(case_id)
