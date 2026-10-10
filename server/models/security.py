from .db import db
from datetime import datetime, timezone
from .user import generate_uuid

class SecurityEvent(db.Model):
    __tablename__ = 'security_events'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    event_type = db.Column(db.String(50), nullable=False) # e.g., 'LOGIN_ATTEMPT', 'LOCATION_DENIED', 'ACCESS_ATTEMPT'
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    attempted_identifier = db.Column(db.String(255), nullable=True)
    
    ip_address = db.Column(db.String(45), nullable=True, index=True)
    ip_version = db.Column(db.String(4), nullable=True)
    ip_country = db.Column(db.String(100), nullable=True)
    ip_region = db.Column(db.String(100), nullable=True)
    ip_city = db.Column(db.String(100), nullable=True)
    ip_postal_code = db.Column(db.String(20), nullable=True)
    ip_latitude = db.Column(db.Float, nullable=True)
    ip_longitude = db.Column(db.Float, nullable=True)
    isp = db.Column(db.String(255), nullable=True)
    organization = db.Column(db.String(255), nullable=True)
    asn = db.Column(db.String(100), nullable=True)
    
    gps_latitude = db.Column(db.Float, nullable=True)
    gps_longitude = db.Column(db.Float, nullable=True)
    gps_accuracy = db.Column(db.Float, nullable=True)
    location_permission = db.Column(db.String(20), nullable=True)
    
    browser = db.Column(db.String(100), nullable=True)
    browser_version = db.Column(db.String(50), nullable=True)
    operating_system = db.Column(db.String(100), nullable=True)
    device_type = db.Column(db.String(50), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    
    mfa_result = db.Column(db.String(50), nullable=True)
    event_result = db.Column(db.String(50), nullable=False, index=True)
    failure_reason = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = db.relationship('User', backref=db.backref('security_events', lazy=True))
