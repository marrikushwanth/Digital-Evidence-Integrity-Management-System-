from flask import Blueprint, request
from controllers import evidence_controller
from utils.auth_utils import jwt_required, role_required

evidence_bp = Blueprint('evidence', __name__, url_prefix='/api/evidence')

@evidence_bp.route('/', methods=['POST'])
@jwt_required
@role_required(['Admin', 'Investigator'])
def upload_evidence():
    return evidence_controller.upload_evidence(request)

@evidence_bp.route('/', methods=['GET'])
@jwt_required
def get_all_evidence():
    return evidence_controller.get_all_evidence(request)

@evidence_bp.route('/<evidence_id>', methods=['GET'])
@jwt_required
def get_evidence(evidence_id):
    return evidence_controller.get_evidence(evidence_id)

@evidence_bp.route('/<evidence_id>/download', methods=['GET'])
@jwt_required
def download_evidence(evidence_id):
    return evidence_controller.download_evidence(evidence_id)

@evidence_bp.route('/verify', methods=['POST'])
@jwt_required
def verify_evidence():
    return evidence_controller.verify_evidence(request)

@evidence_bp.route('/<evidence_id>', methods=['DELETE'])
@jwt_required
@role_required(['Admin'])
def delete_evidence(evidence_id):
    return evidence_controller.delete_evidence(evidence_id)

@evidence_bp.route('/blockchain/status', methods=['GET'])
@jwt_required
def get_blockchain_status():
    return evidence_controller.get_blockchain_status()
