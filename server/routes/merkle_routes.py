from flask import Blueprint, request, jsonify
from controllers.merkle_controller import (
    create_merkle_batch,
    finalize_merkle_batch,
    get_merkle_batch,
    get_merkle_proof,
    verify_merkle_proof_api,
    get_all_batches,
    verify_entire_batch,
    verify_uploaded_batch_files,
    update_batch_name,
    add_evidence_to_batch,
    remove_evidence_from_batch,
    clone_merkle_batch,
    get_blockchain_status
)
from utils.auth_utils import jwt_required, role_required

merkle_bp = Blueprint('merkle', __name__, url_prefix='/api/merkle')

@merkle_bp.route('/blockchain-status', methods=['GET'])
@jwt_required
def api_get_blockchain_status():
    return get_blockchain_status()

@merkle_bp.route('/batches', methods=['POST'])
@jwt_required
@role_required(['Super Admin', 'Admin', 'Investigator'])
def api_create_batch():
    return create_merkle_batch()

@merkle_bp.route('/batches', methods=['GET'])
@jwt_required
def api_get_batches():
    return get_all_batches()

@merkle_bp.route('/batches/<batch_id>/finalize', methods=['POST'])
@jwt_required
@role_required(['Super Admin', 'Admin'])
def api_finalize_batch(batch_id):
    return finalize_merkle_batch(batch_id)

@merkle_bp.route('/batches/<batch_id>', methods=['GET'])
@jwt_required
def api_get_batch(batch_id):
    return get_merkle_batch(batch_id)

@merkle_bp.route('/batches/<batch_id>/proof/<evidence_id>', methods=['GET'])
@jwt_required
def api_get_proof(batch_id, evidence_id):
    return get_merkle_proof(batch_id, evidence_id)

@merkle_bp.route('/verify', methods=['POST'])
@jwt_required
def api_verify_proof():
    return verify_merkle_proof_api()

@merkle_bp.route('/batches/<batch_id>/verify', methods=['POST'])
@jwt_required
def api_verify_entire_batch(batch_id):
    return verify_entire_batch(batch_id)

@merkle_bp.route('/batches/<batch_id>/verify-uploaded', methods=['POST'])
@jwt_required
def api_verify_uploaded_batch_files(batch_id):
    return verify_uploaded_batch_files(batch_id)

@merkle_bp.route('/batches/<batch_id>', methods=['PATCH'])
@jwt_required
def api_update_batch_name(batch_id):
    return update_batch_name(batch_id)

@merkle_bp.route('/batches/<batch_id>/evidence', methods=['POST'])
@jwt_required
def api_add_evidence_to_batch(batch_id):
    return add_evidence_to_batch(batch_id)

@merkle_bp.route('/batches/<batch_id>/evidence/<evidence_id>', methods=['DELETE'])
@jwt_required
def api_remove_evidence_from_batch(batch_id, evidence_id):
    return remove_evidence_from_batch(batch_id, evidence_id)

@merkle_bp.route('/batches/<batch_id>/clone', methods=['POST'])
@jwt_required
def api_clone_merkle_batch(batch_id):
    return clone_merkle_batch(batch_id)
