from flask import Blueprint, current_app
from sqlalchemy import text
from models.db import db
from services.blockchain_service import verify_blockchain_connection
from utils.response import success_response, error_response

health_bp = Blueprint('health', __name__, url_prefix='/api/health')

@health_bp.route('/', methods=['GET'])
def health_check():
    return success_response('Application is healthy', {
        'application': 'healthy'
    })

@health_bp.route('/database', methods=['GET'])
def database_health():
    try:
        db.session.execute(text('SELECT 1'))
        return success_response('Database is healthy', {'database': 'healthy'})
    except Exception as e:
        return error_response('Database is unhealthy', status_code=503)

@health_bp.route('/blockchain', methods=['GET'])
def blockchain_health():
    is_connected = verify_blockchain_connection()
    if is_connected:
        return success_response('Blockchain is healthy', {'blockchain': 'healthy'})
    else:
        return error_response('Blockchain is unhealthy', status_code=503)

@health_bp.route('/full', methods=['GET'])
def full_health():
    db_healthy = False
    try:
        db.session.execute(text('SELECT 1'))
        db_healthy = True
    except Exception as e:
        current_app.logger.warning(f"Database health check failed: {e}")
        
    bc_healthy = verify_blockchain_connection()
    
    status_code = 200 if db_healthy and bc_healthy else 503
    status = 'healthy' if status_code == 200 else 'degraded'
    
    return success_response(f'System is {status}', {
        'application': 'healthy',
        'database': 'healthy' if db_healthy else 'unhealthy',
        'blockchain': 'healthy' if bc_healthy else 'unhealthy'
    }, status_code=status_code)
