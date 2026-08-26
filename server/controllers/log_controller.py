from models.log import AuditLog, ChainOfCustody
from utils.response import success_response

def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    data = []
    for log in logs:
        data.append({
            'id': log.id,
            'timestamp': log.timestamp.isoformat(),
            'username': log.username,
            'role': log.role,
            'ip_address': log.ip_address,
            'browser': log.browser,
            'os': log.os,
            'action': log.action,
            'status': log.status,
            'details': log.details
        })
    return success_response('Audit logs retrieved', data)

def get_chain_of_custody():
    logs = ChainOfCustody.query.order_by(ChainOfCustody.timestamp.desc()).all()
    data = []
    for log in logs:
        data.append({
            'id': log.id,
            'timestamp': log.timestamp.isoformat(),
            'evidence_id': log.evidence_id,
            'case_id': log.case_id,
            'username': log.username,
            'role': log.role,
            'action': log.action,
            'status': log.status
        })
    return success_response('Chain of custody retrieved', data)
