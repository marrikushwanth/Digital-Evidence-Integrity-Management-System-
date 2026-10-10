from flask import request, g
from models.db import db
from models.merkle import MerkleBatch, MerkleLeaf
from models.evidence import Evidence
from services.merkle_service import MerkleTree, verify_merkle_proof
from services.blockchain_service import blockchain_service
from utils.response import success_response, error_response
from datetime import datetime, timezone

def get_blockchain_status():
    status = blockchain_service.get_health_status()
    return success_response('Blockchain status retrieved', status)

def create_merkle_batch():
    data = request.get_json()
    batch_name = data.get('batch_name', '').strip()
    if not batch_name:
        return error_response('Batch Name is required and cannot be empty', 400)
    if len(batch_name) > 150:
        return error_response('Batch Name exceeds maximum length of 150 characters', 400)
        
    evidence_ids = data.get('evidence_ids', [])
    
    if not evidence_ids:
        return error_response('evidence_ids list is required', 400)
        
    user = g.user
    
    # Verify user has access to these evidences
    evidences = Evidence.query.filter(Evidence.id.in_(evidence_ids)).all()
    if len(evidences) != len(evidence_ids):
        return error_response('One or more evidence IDs are invalid', 404)
        
    case_ids = {e.case_id for e in evidences}
    if len(case_ids) > 1:
        return error_response('All evidence in a Merkle batch must belong to the same case', 400)
    
    case_id = list(case_ids)[0]
    
    if user.role_ref.name not in ['Super Admin', 'Admin', 'Auditor']:
        # Investigators can only use their own cases - simplified check
        from models.case import Case
        case = Case.query.get(case_id)
        if case and case.investigator_id != user.id:
            return error_response('Unauthorized to access some evidence', 403)
                
    # Build Merkle tree
    leaves_hashes = [e.file_hash for e in evidences]
    tree = MerkleTree(leaves_hashes)
    merkle_root = tree.get_root()
    
    # Store batch
    batch = MerkleBatch(batch_name=batch_name, merkle_root=merkle_root, leaf_count=len(evidences), case_id=case_id, created_by=user.id)
    db.session.add(batch)
    db.session.flush() # To get batch.id
    
    # Store leaves
    for index, e in enumerate(evidences):
        leaf = MerkleLeaf(
            batch_id=batch.id,
            evidence_id=e.id,
            leaf_hash=e.file_hash,
            leaf_index=index
        )
        db.session.add(leaf)
        
    db.session.commit()
    
    return success_response('Merkle batch created successfully', {
        'id': batch.batch_id,
        'batch_name': batch.batch_name or 'Unnamed Batch',
        'merkle_root': batch.merkle_root,
        'leaf_count': batch.leaf_count,
        'status': batch.status
    }, status_code=201)

def get_all_batches():
    batches = MerkleBatch.query.filter(~MerkleBatch.status.in_(['ARCHIVED', 'DELETED'])).order_by(MerkleBatch.created_at.desc()).all()
    result = []
    for b in batches:
        result.append({
            'id': b.batch_id,
            'batch_name': b.batch_name or 'Unnamed Batch',
            'merkle_root': b.merkle_root,
            'leaf_count': b.leaf_count,
            'status': b.status,
            'blockchain_tx_hash': b.blockchain_tx_hash,
            'created_at': b.created_at.isoformat() + 'Z' if b.created_at else None
        })
    return success_response('Batches retrieved successfully', {'batches': result})

def finalize_merkle_batch(batch_identifier):
    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    if batch.status == 'FINALIZED':
        return error_response('Batch already finalized', 400)
        
    if not blockchain_service.is_connected():
        return error_response('Blockchain service unavailable', 503)
        
    res = blockchain_service.register_merkle_root(
        batch.batch_id,
        batch.merkle_root,
        batch.leaf_count
    )
    
    if res.get('status') == 'REGISTERED':
        batch.status = 'FINALIZED'
        batch.finalized_at = datetime.now(timezone.utc)
        batch.blockchain_tx_hash = res.get('tx_hash')
        batch.blockchain_status = 'REGISTERED'
        db.session.commit()
        return success_response('Batch finalized and registered on blockchain', {
            'tx_hash': batch.blockchain_tx_hash
        })
    else:
        batch.blockchain_status = 'FAILED'
        db.session.commit()
        return error_response(res.get('error', 'Blockchain registration failed'), 500)

def get_merkle_batch(batch_identifier):
    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    return success_response('Batch details retrieved successfully', {
        'id': batch.batch_id,
        'batch_name': batch.batch_name or 'Unnamed Batch',
        'merkle_root': batch.merkle_root,
        'leaf_count': batch.leaf_count,
        'status': batch.status,
        'blockchain_tx_hash': batch.blockchain_tx_hash,
        'blockchain_status': batch.blockchain_status,
        'created_at': batch.created_at.isoformat() + 'Z' if batch.created_at else None,
        'finalized_at': batch.finalized_at.isoformat() + 'Z' if batch.finalized_at else None
    })

def get_merkle_proof(batch_identifier, evidence_id):
    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    leaf = MerkleLeaf.query.filter_by(batch_id=batch.id, evidence_id=evidence_id).first()
    if not leaf:
        return error_response('Evidence not found in this batch', 404)
        
    # Reconstruct tree to get proof
    leaves = MerkleLeaf.query.filter_by(batch_id=batch.id).order_by(MerkleLeaf.leaf_index.asc()).all()
    leaves_hashes = [l.leaf_hash for l in leaves]
    
    tree = MerkleTree(leaves_hashes)
    proof = tree.get_proof(leaf.leaf_index)
    
    return success_response('Proof generated successfully', {
        'evidence_id': evidence_id,
        'leaf_hash': leaf.leaf_hash,
        'leaf_index': leaf.leaf_index,
        'proof': proof,
        'merkle_root': batch.merkle_root
    })

def verify_merkle_proof_api():
    data = request.get_json()
    leaf_hash = data.get('leaf_hash')
    proof = data.get('proof')
    merkle_root = data.get('merkle_root')
    
    if not leaf_hash or proof is None or not merkle_root:
        return error_response('leaf_hash, proof, and merkle_root are required', 400)
        
    is_valid = verify_merkle_proof(leaf_hash, proof, merkle_root)
    return success_response('Proof verified successfully', {'valid': is_valid})

def verify_entire_batch(batch_identifier):
    from flask import current_app
    import os
    from services.crypto_service import CryptoService
    from services.hash_service import HashService

    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    leaves = MerkleLeaf.query.filter_by(batch_id=batch.id).order_by(MerkleLeaf.leaf_index.asc()).all()
    if not leaves:
        return error_response('Batch is empty', 400)
        
    # Get blockchain root
    bc_root = None
    if blockchain_service.is_connected():
        bc_root_hex = blockchain_service.get_merkle_batch_root(batch.batch_id)
        if bc_root_hex:
            bc_root = bc_root_hex
            
    blockchain_verified = False
    reference_root = batch.merkle_root
    if bc_root:
        if bc_root.lower() == batch.merkle_root.lower():
            blockchain_verified = True
        else:
            reference_root = bc_root # if they mismatch, the blockchain one is the truth
            
    # Prepare MerkleTree to get proofs
    leaves_hashes = [l.leaf_hash for l in leaves]
    original_tree = MerkleTree(leaves_hashes)
    
    files_result = []
    verified_count = 0
    failed_count = 0
    
    for leaf in leaves:
        evidence = Evidence.query.get(leaf.evidence_id)
        status = "INTEGRITY FAILURE"
        
        if evidence:
            encrypted_path = os.path.join(current_app.config['ENCRYPTED_FOLDER'], evidence.file_name)
            if os.path.exists(encrypted_path):
                try:
                    decrypted_bytes = CryptoService.decrypt_file_to_memory(encrypted_path)
                    calculated_hash = HashService.generate_sha256_bytes(decrypted_bytes)
                    
                    proof = original_tree.get_proof(leaf.leaf_index)
                    is_valid = verify_merkle_proof(calculated_hash, proof, reference_root)
                    
                    if is_valid:
                        status = "VERIFIED"
                except Exception as e:
                    current_app.logger.error(f"Error verifying evidence {evidence.id}: {str(e)}")
                    status = "INTEGRITY FAILURE"
            else:
                status = "FILE NOT FOUND"
        else:
            status = "RECORD NOT FOUND"
            
        if status == "VERIFIED":
            verified_count += 1
        else:
            failed_count += 1
            
        files_result.append({
            "evidence_id": leaf.evidence_id,
            "filename": evidence.original_name if evidence else "Unknown",
            "status": status
        })
        
    overall_status = "FULLY VERIFIED" if failed_count == 0 else "INTEGRITY FAILURE"
    
    return success_response('Batch verification complete', {
        "batch_id": batch.batch_id,
        "batch_name": batch.batch_name or 'Unnamed Batch',
        "total_files": len(leaves),
        "verified_files": verified_count,
        "failed_files": failed_count,
        "blockchain_verified": blockchain_verified,
        "overall_status": overall_status,
        "files": files_result
    })

def verify_uploaded_batch_files(batch_identifier):
    from flask import request
    import hashlib

    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    leaves = MerkleLeaf.query.filter_by(batch_id=batch.id).order_by(MerkleLeaf.leaf_index.asc()).all()
    if not leaves:
        return error_response('Batch is empty', 400)
        
    uploaded_files = request.files.getlist('files[]')
    if not uploaded_files:
        uploaded_files = request.files.getlist('files')
        
    # Get blockchain root
    bc_root = None
    if blockchain_service.is_connected():
        bc_root_hex = blockchain_service.get_merkle_batch_root(batch.batch_id)
        if bc_root_hex:
            bc_root = bc_root_hex
            
    blockchain_verified = False
    reference_root = batch.merkle_root
    if bc_root:
        if bc_root.lower() == batch.merkle_root.lower():
            blockchain_verified = True
        else:
            reference_root = bc_root # if they mismatch, the blockchain one is the truth
            
    # Prepare MerkleTree to get proofs
    leaves_hashes = [l.leaf_hash for l in leaves]
    original_tree = MerkleTree(leaves_hashes)
    
    # Store all expected leaves as a list to allow duplicate filenames and proper matching
    expected_items = []
    for leaf in leaves:
        evidence = Evidence.query.get(leaf.evidence_id)
        expected_items.append({
            'leaf': leaf,
            'evidence': evidence,
            'original_name': evidence.original_name if evidence else 'Unknown',
            'matched': False
        })
            
    files_result = []
    verified_count = 0
    failed_count = 0
    missing_count = 0
    extra_count = 0
    
    # Pre-hash all uploaded files
    uploaded_files_data = []
    for uploaded_file in uploaded_files:
        sha256_hash = hashlib.sha256()
        while True:
            chunk = uploaded_file.read(4096)
            if not chunk:
                break
            sha256_hash.update(chunk)
        new_hash = sha256_hash.hexdigest()
        uploaded_file.seek(0)
        uploaded_files_data.append({
            'filename': uploaded_file.filename,
            'hash': new_hash,
            'matched': False
        })

    # Pass 1: Exact Hash Match
    for up_file in uploaded_files_data:
        for item in expected_items:
            if not item['matched'] and item['leaf'].leaf_hash == up_file['hash']:
                # Perfect match! Verify proof
                proof = original_tree.get_proof(item['leaf'].leaf_index)
                is_valid = verify_merkle_proof(up_file['hash'], proof, reference_root)
                
                status = "VERIFIED" if is_valid else "INTEGRITY FAILURE"
                if status == "VERIFIED":
                    verified_count += 1
                else:
                    failed_count += 1
                    
                files_result.append({
                    "evidence_id": item['leaf'].evidence_id,
                    "filename": up_file['filename'],
                    "status": status
                })
                item['matched'] = True
                up_file['matched'] = True
                break

    # Pass 2: Filename Match for Integrity Failures
    for up_file in uploaded_files_data:
        if up_file['matched']:
            continue
        
        # Look for unmatched expected item with same filename
        matched_item = None
        for item in expected_items:
            if not item['matched'] and item['original_name'] == up_file['filename']:
                matched_item = item
                break
                
        if matched_item:
            # We found a filename match but hashes differed -> Integrity Failure
            failed_count += 1
            files_result.append({
                "evidence_id": matched_item['leaf'].evidence_id,
                "filename": up_file['filename'],
                "status": "INTEGRITY FAILURE"
            })
            matched_item['matched'] = True
            up_file['matched'] = True
        else:
            # Extra file not in batch
            extra_count += 1
            files_result.append({
                "evidence_id": None,
                "filename": up_file['filename'],
                "status": "FILE NOT IN SELECTED MERKLE BATCH"
            })
            up_file['matched'] = True

    # Pass 3: Missing files
    for item in expected_items:
        if not item['matched']:
            missing_count += 1
            files_result.append({
                "evidence_id": item['leaf'].evidence_id,
                "filename": item['original_name'],
                "status": "NOT PROVIDED"
            })
    
    overall_status = "FULLY VERIFIED"
    if failed_count > 0:
        overall_status = "INTEGRITY FAILURE"
    elif missing_count > 0:
        overall_status = "PARTIAL VERIFICATION"
        
    return success_response('Batch uploaded files verification complete', {
        "batch_id": batch.batch_id,
        "batch_name": batch.batch_name or 'Unnamed Batch',
        "expected_files": len(expected_items),
        "uploaded_files": len(uploaded_files_data),
        "verified_files": verified_count,
        "not_provided": missing_count,
        "failed_files": failed_count,
        "extra_count": extra_count,
        "blockchain_verified": blockchain_verified,
        "overall_status": overall_status,
        "files": files_result
    })

def _recalculate_merkle_tree(batch):
    # Rebuilds the Merkle tree for a given batch based on its current leaves
    leaves = MerkleLeaf.query.filter_by(batch_id=batch.id).order_by(MerkleLeaf.leaf_index.asc()).all()
    if not leaves:
        return
        
    leaves_hashes = [l.leaf_hash for l in leaves]
    tree = MerkleTree(leaves_hashes)
    merkle_root = tree.get_root()
    
    batch.merkle_root = merkle_root
    batch.leaf_count = len(leaves)
    db.session.commit()

def update_batch_name(batch_identifier):
    data = request.get_json()
    batch_name = data.get('batch_name', '').strip()
    
    if not batch_name:
        return error_response('Batch name is required', 400)
    if len(batch_name) > 150:
        return error_response('Batch name exceeds maximum length of 150 characters', 400)
        
    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    # Metadata update allowed for both PENDING and FINALIZED
    batch.batch_name = batch_name
    db.session.commit()
    
    return success_response('Batch name updated successfully', {'batch_name': batch.batch_name})

def add_evidence_to_batch(batch_identifier):
    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    if batch.status == 'FINALIZED':
        return error_response('Finalized Merkle batches are immutable. To change the evidence set, create a new Merkle batch.', 400)
        
    data = request.get_json()
    evidence_ids = data.get('evidence_ids', [])
    if not evidence_ids:
        return error_response('evidence_ids list is required', 400)
        
    evidences = Evidence.query.filter(Evidence.id.in_(evidence_ids)).all()
    if len(evidences) != len(evidence_ids):
        return error_response('One or more evidence IDs are invalid', 404)
        
    # Ensure all evidence belongs to the same case as the batch
    if any(e.case_id != batch.case_id for e in evidences):
        return error_response('All evidence must belong to the same case as the batch', 400)
        
    current_leaves = MerkleLeaf.query.filter_by(batch_id=batch.id).order_by(MerkleLeaf.leaf_index.asc()).all()
    existing_evidence_ids = {l.evidence_id for l in current_leaves}
    
    next_index = len(current_leaves)
    
    for e in evidences:
        if e.id not in existing_evidence_ids:
            leaf = MerkleLeaf(
                batch_id=batch.id,
                evidence_id=e.id,
                leaf_hash=e.file_hash,
                leaf_index=next_index
            )
            db.session.add(leaf)
            next_index += 1
            
    db.session.commit()
    _recalculate_merkle_tree(batch)
    
    return success_response('Evidence added and Merkle tree recalculated', {'merkle_root': batch.merkle_root, 'leaf_count': batch.leaf_count})

def remove_evidence_from_batch(batch_identifier, evidence_id):
    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    if batch.status == 'FINALIZED':
        return error_response('Finalized Merkle batches are immutable. To change the evidence set, create a new Merkle batch.', 400)
        
    leaf = MerkleLeaf.query.filter_by(batch_id=batch.id, evidence_id=evidence_id).first()
    if not leaf:
        return error_response('Evidence not found in this batch', 404)
        
    current_leaves = MerkleLeaf.query.filter_by(batch_id=batch.id).count()
    if current_leaves <= 1:
        return error_response('At least one evidence file is required for a Merkle batch. Cannot remove the last file.', 400)
        
    db.session.delete(leaf)
    db.session.commit()
    
    # Reindex remaining leaves
    remaining_leaves = MerkleLeaf.query.filter_by(batch_id=batch.id).order_by(MerkleLeaf.leaf_index.asc()).all()
    for index, l in enumerate(remaining_leaves):
        l.leaf_index = index
    db.session.commit()
    
    _recalculate_merkle_tree(batch)
    
    return success_response('Evidence removed and Merkle tree recalculated', {'merkle_root': batch.merkle_root, 'leaf_count': batch.leaf_count})

def clone_merkle_batch(batch_identifier):
    original_batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not original_batch:
        return error_response('Batch not found', 404)
        
    new_batch = MerkleBatch(
        batch_name=f"{original_batch.batch_name or 'Unnamed Batch'} (Copy)",
        merkle_root=original_batch.merkle_root,
        leaf_count=original_batch.leaf_count,
        case_id=original_batch.case_id,
        created_by=g.user.id
    )
    db.session.add(new_batch)
    db.session.flush()
    
    original_leaves = MerkleLeaf.query.filter_by(batch_id=original_batch.id).order_by(MerkleLeaf.leaf_index.asc()).all()
    for l in original_leaves:
        new_leaf = MerkleLeaf(
            batch_id=new_batch.id,
            evidence_id=l.evidence_id,
            leaf_hash=l.leaf_hash,
            leaf_index=l.leaf_index
        )
        db.session.add(new_leaf)
        
    db.session.commit()
    
    return success_response('Batch cloned successfully', {
        'id': new_batch.batch_id,
        'batch_name': new_batch.batch_name,
        'merkle_root': new_batch.merkle_root,
        'leaf_count': new_batch.leaf_count,
        'status': new_batch.status
    }, status_code=201)

def delete_merkle_batch(batch_identifier):
    batch = MerkleBatch.query.filter_by(batch_id=batch_identifier).first()
    if not batch:
        return error_response('Batch not found', 404)
        
    if batch.status == 'FINALIZED' or batch.blockchain_status == 'REGISTERED':
        # Safely archive if already registered on blockchain
        batch.status = 'ARCHIVED'
        db.session.commit()
        from utils.logger import log_audit
        log_audit('MERKLE_BATCH_ARCHIVED', f"Archived finalized Merkle batch {batch_identifier}")
        return success_response('Batch archived successfully')
    else:
        # Physical delete for pending batches (leaves cascade)
        db.session.delete(batch)
        db.session.commit()
        from utils.logger import log_audit
        log_audit('MERKLE_BATCH_DELETED', f"Deleted pending Merkle batch {batch_identifier}")
        return success_response('Batch deleted successfully')

