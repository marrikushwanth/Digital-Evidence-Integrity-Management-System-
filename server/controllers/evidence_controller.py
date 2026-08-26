import os
import re
from flask import current_app, g, send_file, after_this_request
from werkzeug.utils import secure_filename
from models.db import db
from models.evidence import Evidence
from models.case import Case
from services.crypto_service import CryptoService
from services.hash_service import HashService
from utils.response import success_response, error_response
from utils.logger import log_audit, log_chain_of_custody

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'txt', 'csv', 'log', 'zip'}
REJECTED_EXTENSIONS = {'exe', 'dll', 'bat', 'cmd', 'msi', 'js', 'ps1', 'php', 'sh'}

def allowed_file(filename):
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in REJECTED_EXTENSIONS:
        return False
    return ext in ALLOWED_EXTENSIONS

def is_safe_filename(filename):
    # Prevent path traversal and reject dangerous patterns
    if '..' in filename or filename.startswith('/'):
        return False
    # Only allow alphanumeric, dash, underscore, dot
    if not re.match(r'^[\w\-. ]+$', filename):
        return False
    return True

def upload_evidence(request):
    if 'file' not in request.files:
        return error_response('No file provided', status_code=400)
        
    file = request.files['file']
    case_id = request.form.get('case_id')
    description = request.form.get('description', '')
    
    if file.filename == '':
        return error_response('No file selected', status_code=400)
        
    if not allowed_file(file.filename):
        return error_response('Invalid file type. Dangerous or unsupported extension.', status_code=422)
        
    if not is_safe_filename(file.filename):
        return error_response('Dangerous filename detected.', status_code=422)
        
    if not case_id:
        return error_response('Case ID is required', status_code=422)
        
    case = db.session.get(Case, case_id)
    if not case:
        return error_response('Case not found', status_code=404)
        
    original_filename = secure_filename(file.filename)
    temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], original_filename)
    
    try:
        file.save(temp_path)
        file_hash = HashService.generate_sha256(temp_path)
        
        # Check for duplicates across the entire system
        existing_evidence = Evidence.query.filter_by(file_hash=file_hash).first()
        if existing_evidence:
            os.remove(temp_path)
            return error_response('Duplicate evidence. This exact file already exists in the system.', status_code=409)
            
        encrypted_filename = f"{file_hash}.enc"
        encrypted_path = os.path.join(current_app.config['ENCRYPTED_FOLDER'], encrypted_filename)
        
        CryptoService.encrypt_file(temp_path, encrypted_path)
        file_size = os.path.getsize(temp_path)
        os.remove(temp_path)
        
        new_evidence = Evidence(
            file_name=encrypted_filename,
            original_name=original_filename,
            file_size=file_size,
            mime_type=file.mimetype,
            file_hash=file_hash,
            description=description,
            case_id=case_id,
            uploaded_by=g.user.id
        )
        
        db.session.add(new_evidence)
        db.session.commit()
        
        # Phase 3: Blockchain Integration
        from services.blockchain_service import blockchain_service
        bc_res = blockchain_service.register_evidence(
            new_evidence.id, case_id, file_hash, g.user.id
        )
        if bc_res and bc_res.get("status") == "REGISTERED":
            new_evidence.blockchain_status = "REGISTERED"
            new_evidence.blockchain_tx_hash = bc_res.get("tx_hash")
            db.session.commit()
            log_audit('BLOCKCHAIN_REGISTER', f"Registered evidence {new_evidence.id} on blockchain. TX: {bc_res.get('tx_hash')}")
        else:
            new_evidence.blockchain_status = "FAILED"
            db.session.commit()
            error_msg = bc_res.get("error", "Unknown error") if bc_res else "No response"
            log_audit('BLOCKCHAIN_REGISTER_FAILED', f"Failed to register evidence {new_evidence.id} on blockchain: {error_msg}", "FAILURE")

        log_audit('UPLOAD_EVIDENCE', f"Uploaded evidence {new_evidence.id} for case {case_id}")
        log_chain_of_custody(new_evidence.id, case_id, "Evidence Uploaded")
        
        return success_response('Evidence uploaded successfully', {
            'id': new_evidence.id,
            'original_name': new_evidence.original_name,
            'file_hash': new_evidence.file_hash,
            'blockchain_status': new_evidence.blockchain_status
        }, status_code=201)
        
    except Exception as e:
        current_app.logger.error(f"Evidence upload failed: {str(e)}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return error_response('Failed to process upload', status_code=500)

def get_all_evidence(request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 50, type=int)
    per_page = min(max(1, per_page), 100)
    
    pagination = Evidence.query.order_by(Evidence.uploaded_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    data = []
    for ev in pagination.items:
        data.append({
            'id': ev.id,
            'original_name': ev.original_name,
            'file_size': ev.file_size,
            'mime_type': ev.mime_type,
            'file_hash': ev.file_hash,
            'description': ev.description,
            'case_id': ev.case_id,
            'uploaded_at': ev.uploaded_at.isoformat(),
            'uploader': ev.uploader.username,
            'blockchain_status': ev.blockchain_status,
            'blockchain_tx_hash': ev.blockchain_tx_hash
        })
        
    return success_response('Evidence retrieved', {
        'items': data,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    })

def get_evidence(evidence_id):
    evidence = db.session.get(Evidence, evidence_id)
    if not evidence:
        return error_response('Evidence not found', status_code=404)
        
    return success_response('Evidence retrieved', {
        'id': evidence.id,
        'original_name': evidence.original_name,
        'file_size': evidence.file_size,
        'mime_type': evidence.mime_type,
        'file_hash': evidence.file_hash,
        'description': evidence.description,
        'case_id': evidence.case_id,
        'uploaded_at': evidence.uploaded_at.isoformat(),
        'uploader': evidence.uploader.username,
        'blockchain_status': evidence.blockchain_status,
        'blockchain_tx_hash': evidence.blockchain_tx_hash
    })

def download_evidence(evidence_id):
    evidence = db.session.get(Evidence, evidence_id)
    if not evidence:
        return error_response('Evidence not found', status_code=404)
        
    encrypted_path = os.path.join(current_app.config['ENCRYPTED_FOLDER'], evidence.file_name)
    if not os.path.exists(encrypted_path):
        return error_response('Encrypted file not found on disk', status_code=404)
        
    temp_decrypted_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"temp_dec_{evidence.original_name}")
    
    try:
        CryptoService.decrypt_file(encrypted_path, temp_decrypted_path)
        
        log_audit('DOWNLOAD_EVIDENCE', f"Downloaded evidence {evidence.id}")
        log_chain_of_custody(evidence.id, evidence.case_id, "Evidence Downloaded")
        
        @after_this_request
        def remove_file(response):
            try:
                os.remove(temp_decrypted_path)
            except Exception as error:
                current_app.logger.error(f"Error removing temp file: {error}")
            return response
            
        return send_file(temp_decrypted_path, as_attachment=True, download_name=evidence.original_name)
    except Exception as e:
        current_app.logger.error(f"Evidence download failed: {str(e)}")
        if os.path.exists(temp_decrypted_path):
            os.remove(temp_decrypted_path)
        return error_response('Failed to decrypt file', status_code=500)

def verify_evidence(request):
    if 'file' not in request.files:
        return error_response('No file provided', status_code=400)
        
    file = request.files['file']
    evidence_id = request.form.get('evidence_id')
    
    if not evidence_id:
        return error_response('Evidence ID is required', status_code=422)
        
    evidence = db.session.get(Evidence, evidence_id)
    if not evidence:
        return error_response('Evidence not found', status_code=404)
        
    temp_path = os.path.join(current_app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
    
    try:
        file.save(temp_path)
        uploaded_hash = HashService.generate_sha256(temp_path)
        os.remove(temp_path)
        
        db_match = (uploaded_hash == evidence.file_hash)
        
        from services.blockchain_service import blockchain_service
        bc_status = "UNKNOWN"
        bc_match = None
        
        if not blockchain_service.is_connected():
            bc_status = "BLOCKCHAIN UNAVAILABLE"
        else:
            bc_data = blockchain_service.get_evidence(evidence.id)
            if not bc_data:
                bc_status = "NOT REGISTERED"
            else:
                bc_status = "REGISTERED"
                bc_match = (bc_data["fileHash"] == uploaded_hash)
                
        # Determine overall result
        if db_match and bc_match is True:
            result = "FULLY VERIFIED"
            match = True
        elif db_match and bc_match is False:
            result = "DATABASE VERIFIED ONLY"
            match = False # Overall it's a failure since blockchain didn't match
        elif not db_match and bc_match is True:
            result = "BLOCKCHAIN VERIFIED ONLY"
            match = False
        elif not db_match and (bc_match is False or bc_match is None):
            result = "INTEGRITY FAILURE"
            match = False
        else:
            # db_match is true, but bc is offline or not registered
            if bc_status == "BLOCKCHAIN UNAVAILABLE":
                result = "BLOCKCHAIN UNAVAILABLE"
            else:
                result = "DATABASE VERIFIED ONLY"
            match = True # From DB perspective it's true

        if match:
            log_audit('VERIFY_EVIDENCE', f"Successfully verified integrity for evidence {evidence.id}. Result: {result}")
            log_chain_of_custody(evidence.id, evidence.case_id, f"Evidence Verified: {result}")
            return success_response(result, {
                'match': True,
                'db_match': db_match,
                'bc_match': bc_match,
                'bc_status': bc_status,
                'calculated_hash': uploaded_hash
            })
        else:
            log_audit('VERIFY_EVIDENCE_FAILED', f"Integrity check failed for evidence {evidence.id}. Result: {result}", "FAILURE")
            log_chain_of_custody(evidence.id, evidence.case_id, f"Evidence Verification Failed: {result}", "FAILURE")
            return success_response(result, {
                'match': False,
                'db_match': db_match,
                'bc_match': bc_match,
                'bc_status': bc_status,
                'calculated_hash': uploaded_hash
            })
            
    except Exception as e:
        current_app.logger.error(f"Evidence verification failed: {str(e)}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return error_response('Verification failed', status_code=500)

def delete_evidence(evidence_id):
    evidence = db.session.get(Evidence, evidence_id)
    if not evidence:
        return error_response('Evidence not found', status_code=404)
        
    encrypted_path = os.path.join(current_app.config['ENCRYPTED_FOLDER'], evidence.file_name)
    
    try:
        if os.path.exists(encrypted_path):
            os.remove(encrypted_path)
            
        case_id = evidence.case_id
        db.session.delete(evidence)
        db.session.commit()
        
        log_audit('DELETE_EVIDENCE', f"Deleted evidence {evidence_id}")
        log_chain_of_custody(evidence_id, case_id, "Evidence Deleted")
        
        return success_response('Evidence deleted successfully')
    except Exception as e:
        current_app.logger.error(f"Evidence deletion failed: {str(e)}")
        return error_response('Failed to delete evidence', status_code=500)

def get_blockchain_status():
    from services.blockchain_service import blockchain_service
    is_connected = blockchain_service.is_connected()
    return success_response('Blockchain status retrieved', {
        'connected': is_connected,
        'status': 'ONLINE' if is_connected else 'OFFLINE'
    })
