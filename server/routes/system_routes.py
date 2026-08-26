from flask import Blueprint, g
from models.user import User
from models.evidence import Evidence
from models.auth import ActiveSession
from utils.auth_utils import jwt_required, role_required
from utils.response import success_response
from models.db import db
from sqlalchemy import func
from middleware.metrics import runtime_metrics

system_bp = Blueprint('system', __name__, url_prefix='/api/system')

@system_bp.route('/metrics', methods=['GET'])
@jwt_required
@role_required(['Super Admin', 'Admin'])
def get_system_metrics():
    # Aggregated metrics for the dashboard
    total_users = User.query.count()
    active_sessions = ActiveSession.query.count()
    total_evidence = Evidence.query.count()
    verified_evidence = Evidence.query.filter_by(status='Verified').count()
    mfa_enabled_users = User.query.filter(User.mfa_secret.isnot(None)).count()
    locked_accounts = User.query.filter(User.locked_until.isnot(None)).count()
    
    # Let's count failed logins broadly
    failed_logins = db.session.query(func.sum(User.failed_login_attempts)).scalar() or 0
    
    metrics = {
        'totalUsers': total_users,
        'activeSessions': active_sessions,
        'totalEvidence': total_evidence,
        'verifiedEvidence': verified_evidence,
        'mfaEnabledUsers': mfa_enabled_users,
        'lockedAccounts': locked_accounts,
        'failedLogins': int(failed_logins),
        
        # Dynamic API Metrics
        'requestCount': runtime_metrics['request_count'],
        'error4xxCount': runtime_metrics['error_4xx_count'],
        'error5xxCount': runtime_metrics['error_5xx_count'],
        'avgResponseTimeMs': round(runtime_metrics['total_response_time_ms'] / max(1, runtime_metrics['response_count']), 2)
    }
    
    return success_response('System metrics retrieved', metrics)
