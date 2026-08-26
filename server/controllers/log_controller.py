from models.log import AuditLog, ChainOfCustody
from utils.response import success_response

def get_audit_logs(request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 50, type=int)
    per_page = min(max(1, per_page), 100)
    
    pagination = AuditLog.query.order_by(AuditLog.timestamp.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    data = []
    for log in pagination.items:
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
    return success_response('Audit logs retrieved', {
        'items': data,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    })

def get_chain_of_custody(request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 50, type=int)
    per_page = min(max(1, per_page), 100)
    
    pagination = ChainOfCustody.query.order_by(ChainOfCustody.timestamp.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    data = []
    for log in pagination.items:
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
    return success_response('Chain of custody retrieved', {
        'items': data,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    })
