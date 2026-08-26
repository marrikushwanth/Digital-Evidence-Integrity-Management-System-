from models.db import db
from models.log import AuditLog, ChainOfCustody
from flask import request, g
import logging
import json

# Configure structured logging
app_logger = logging.getLogger('deims_app')
app_logger.setLevel(logging.INFO)
if not app_logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    app_logger.addHandler(handler)

def get_request_id():
    return getattr(g, 'request_id', 'NO-REQUEST-ID')

def get_username():
    return getattr(g.user, 'username', 'SYSTEM') if hasattr(g, 'user') else 'SYSTEM'

def structured_log(level, action, details):
    log_data = {
        'request_id': get_request_id(),
        'user': get_username(),
        'action': action,
        'details': details,
        'ip': request.remote_addr if request else '127.0.0.1'
    }
    if level == 'info':
        app_logger.info(json.dumps(log_data))
    elif level == 'error':
        app_logger.error(json.dumps(log_data))
    elif level == 'warning':
        app_logger.warning(json.dumps(log_data))

def log_audit(action, details, status="SUCCESS"):
    try:
        username = get_username()
        role = g.user.role_ref.name if hasattr(g, 'user') and g.user.role_ref else 'System'
        
        # Log via structured logging too
        structured_log('info', action, f"{status} - {details}")
        
        # Get basic request info
        ip_address = request.remote_addr if request else '127.0.0.1'
        user_agent = request.user_agent.string if request else 'Unknown'
        
        # Simplified OS/Browser extraction
        browser = request.user_agent.browser if request and request.user_agent.browser else 'Unknown'
        os = request.user_agent.platform if request and request.user_agent.platform else 'Unknown'
        
        log = AuditLog(
            username=username,
            role=role,
            ip_address=ip_address,
            browser=f"{browser} ({user_agent[:50]}...)",
            os=os,
            action=action,
            status=status,
            details=details
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        print(f"Failed to write audit log: {e}")
        db.session.rollback()

def log_chain_of_custody(evidence_id=None, case_id=None, action="Unknown", status="SUCCESS"):
    try:
        username = getattr(g.user, 'username', 'SYSTEM') if hasattr(g, 'user') else 'SYSTEM'
        role = g.user.role_ref.name if hasattr(g, 'user') and g.user.role_ref else 'System'
        
        log = ChainOfCustody(
            evidence_id=evidence_id,
            case_id=case_id,
            username=username,
            role=role,
            action=action,
            status=status
        )
        db.session.add(log)
        db.session.commit()
        
        # Phase 3 Blockchain Custody Recording
        try:
            from services.blockchain_service import blockchain_service
            # We run it synchronously as the architecture doesn't have a background task queue (like Celery)
            bc_res = blockchain_service.record_custody_event(evidence_id, case_id, action)
            if bc_res and bc_res.get("status") == "FAILED":
                # Do not rollback DB. Just audit log the failure
                error_msg = bc_res.get("error", "Unknown error")
                log_audit('BLOCKCHAIN_CUSTODY_FAILED', f"Failed to record custody event to blockchain: {error_msg}", "FAILURE")
        except Exception as bc_err:
            print(f"Blockchain custody recording error: {bc_err}")
            log_audit('BLOCKCHAIN_CUSTODY_ERROR', f"Exception recording custody event to blockchain: {str(bc_err)}", "FAILURE")
            
    except Exception as e:
        print(f"Failed to write chain of custody log: {e}")
        db.session.rollback()
