from flask import g
from sqlalchemy import or_
from datetime import datetime
from models.db import db
from models.case import Case
from utils.response import success_response, error_response
from utils.logger import log_audit, log_chain_of_custody

def get_cases(request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('limit', 50, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    sort_by = request.args.get('sort', 'created_at')
    order = request.args.get('order', 'desc')
    
    query = Case.query
    
    if search:
        query = query.filter(or_(
            Case.title.ilike(f'%{search}%'),
            Case.description.ilike(f'%{search}%'),
            Case.id.ilike(f'%{search}%')
        ))
        
    if status:
        query = query.filter(Case.status == status)
        
    if date_from:
        try:
            df = datetime.fromisoformat(date_from)
            query = query.filter(Case.created_at >= df)
        except ValueError:
            pass # Ignore invalid dates
            
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to)
            query = query.filter(Case.created_at <= dt)
        except ValueError:
            pass
            
    if order == 'desc':
        query = query.order_by(getattr(Case, sort_by).desc())
    else:
        query = query.order_by(getattr(Case, sort_by).asc())
        
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    data = []
    for c in pagination.items:
        data.append({
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'status': c.status,
            'created_at': c.created_at.isoformat(),
            'creator': c.creator.username,
            'evidenceCount': len(c.evidence)
        })
        
    return success_response('Cases retrieved', {
        'items': data,
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages
    })

def create_case(request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description', '')
    
    if not title:
        return error_response('Title is required', status_code=422)
        
    new_case = Case(
        title=title,
        description=description,
        created_by=g.user.id
    )
    
    db.session.add(new_case)
    db.session.commit()
    
    log_audit('CREATE_CASE', f"Created case {new_case.id} - {new_case.title}")
    log_chain_of_custody("SYSTEM", new_case.id, "Case Created", status="SUCCESS")
    
    return success_response('Case created', {
        'id': new_case.id,
        'title': new_case.title,
        'status': new_case.status,
        'created_at': new_case.created_at.isoformat()
    }, status_code=201)

def get_case(case_id):
    case = Case.query.get(case_id)
    if not case:
        return error_response('Case not found', status_code=404)
        
    return success_response('Case retrieved', {
        'id': case.id,
        'title': case.title,
        'description': case.description,
        'status': case.status,
        'created_at': case.created_at.isoformat(),
        'creator': case.creator.username,
        'evidenceCount': len(case.evidence)
    })

def update_case(case_id, request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    case = Case.query.get(case_id)
    if not case:
        return error_response('Case not found', status_code=404)
        
    data = request.get_json()
    if 'title' in data:
        case.title = data['title']
    if 'description' in data:
        case.description = data['description']
    
    db.session.commit()
    log_audit('UPDATE_CASE', f"Updated case {case.id}")
    log_chain_of_custody("SYSTEM", case.id, "Case Updated", status="SUCCESS")
    return success_response('Case updated')

def change_case_status(case_id, request):
    if not request.is_json:
        return error_response('Request must be JSON', status_code=415)
        
    case = Case.query.get(case_id)
    if not case:
        return error_response('Case not found', status_code=404)
        
    data = request.get_json()
    if 'status' not in data or data['status'] not in ['Active', 'Closed']:
        return error_response('Invalid status', status_code=422)
        
    case.status = data['status']
    db.session.commit()
    log_audit('UPDATE_CASE_STATUS', f"Changed status of case {case.id} to {case.status}")
    
    if case.status == 'Closed':
        log_chain_of_custody("SYSTEM", case.id, "Case Closed", status="SUCCESS")
    else:
        log_chain_of_custody("SYSTEM", case.id, "Case Reopened", status="SUCCESS")
        
    return success_response('Case status updated')

def delete_case(case_id):
    case = Case.query.get(case_id)
    if not case:
        return error_response('Case not found', status_code=404)
        
    db.session.delete(case)
    db.session.commit()
    log_audit('DELETE_CASE', f"Deleted case {case.id}")
    # Cannot log chain of custody for a deleted case if the case no longer exists 
    # (foreign key constraint will fail if it's cascade deleting CoC too).
    # Wait, the CoC log has case_id foreign key. If case is deleted, the log is deleted. 
    return success_response('Case deleted')
