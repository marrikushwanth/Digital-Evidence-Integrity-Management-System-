from flask import request
from models.db import db
from models.security import SecurityEvent
from utils.response import success_response, error_response
from services.security_service import record_security_event
from datetime import datetime, timedelta, timezone
from sqlalchemy import func

def log_client_event():
    data = request.json or {}
    event_type = data.get('event_type')
    event_result = data.get('event_result')
    custom_data = {
        'gps_latitude': data.get('gps_latitude'),
        'gps_longitude': data.get('gps_longitude'),
        'gps_accuracy': data.get('gps_accuracy'),
        'location_permission': data.get('location_permission')
    }
    
    event = record_security_event(
        event_type=event_type,
        event_result=event_result,
        custom_data=custom_data
    )
    return success_response('Event logged', {'id': event.id}, status_code=201)

def get_dashboard_stats():
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_attempts = SecurityEvent.query.filter(SecurityEvent.created_at >= today).count()
    successful_logins = SecurityEvent.query.filter(SecurityEvent.created_at >= today, SecurityEvent.event_type == 'LOGIN_ATTEMPT', SecurityEvent.event_result == 'SUCCESS').count()
    failed_logins = SecurityEvent.query.filter(SecurityEvent.created_at >= today, SecurityEvent.event_type == 'LOGIN_ATTEMPT', SecurityEvent.event_result != 'SUCCESS').count()
    location_denials = SecurityEvent.query.filter(SecurityEvent.created_at >= today, SecurityEvent.location_permission == 'DENIED').count()
    mfa_failures = SecurityEvent.query.filter(SecurityEvent.created_at >= today, SecurityEvent.event_type == 'MFA_ATTEMPT', SecurityEvent.event_result != 'SUCCESS').count()
    unique_ips = db.session.query(func.count(func.distinct(SecurityEvent.ip_address))).filter(SecurityEvent.created_at >= today).scalar() or 0
    blocked_visitors = SecurityEvent.query.filter(SecurityEvent.created_at >= today, SecurityEvent.event_result == 'BLOCKED').count()
    
    # Suspicious IPs: more than 5 failed logins today
    suspicious_ips_query = db.session.query(SecurityEvent.ip_address).filter(
        SecurityEvent.created_at >= today,
        SecurityEvent.event_type == 'LOGIN_ATTEMPT',
        SecurityEvent.event_result != 'SUCCESS'
    ).group_by(SecurityEvent.ip_address).having(func.count(SecurityEvent.id) >= 5).all()
    
    suspicious_ips = len(suspicious_ips_query)
    
    return success_response('Dashboard stats', {
        'total_attempts': total_attempts,
        'successful_logins': successful_logins,
        'failed_logins': failed_logins,
        'location_denials': location_denials,
        'mfa_failures': mfa_failures,
        'unique_ips': unique_ips,
        'blocked_visitors': blocked_visitors,
        'suspicious_ips': suspicious_ips
    })

def get_security_events():
    events = SecurityEvent.query.order_by(SecurityEvent.created_at.desc()).limit(100).all()
    data = []
    for e in events:
        data.append({
            'id': e.id,
            'timestamp': e.created_at.isoformat(),
            'event_type': e.event_type,
            'event_result': e.event_result,
            'user_id': e.user_id,
            'attempted_identifier': e.attempted_identifier,
            'ip_address': e.ip_address,
            'ip_country': e.ip_country,
            'ip_region': e.ip_region,
            'ip_city': e.ip_city,
            'gps_latitude': e.gps_latitude,
            'gps_longitude': e.gps_longitude,
            'gps_accuracy': e.gps_accuracy,
            'location_permission': e.location_permission,
            'device_type': e.device_type,
            'browser': e.browser,
            'operating_system': e.operating_system,
            'mfa_result': e.mfa_result,
            'failure_reason': e.failure_reason,
            'isp': e.isp,
            'asn': e.asn
        })
    return success_response('Events retrieved', data)
