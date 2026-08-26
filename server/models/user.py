from .db import db
from datetime import datetime, timezone
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    
    users = db.relationship('User', backref='role_ref', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    department = db.Column(db.String(100))
    organization = db.Column(db.String(150))
    badge_number = db.Column(db.String(50))
    phone = db.Column(db.String(50))
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    status = db.Column(db.String(50), default='Pending Approval') # 'Pending Approval', 'Active', 'Suspended'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Phase 4 Additions
    mfa_enabled = db.Column(db.Boolean, default=False)
    mfa_secret = db.Column(db.String(255), nullable=True) # Encrypted
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    password_changed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    email_notifications_enabled = db.Column(db.Boolean, default=True)
    
    cases_created = db.relationship('Case', backref='creator', lazy=True)
    evidence_uploaded = db.relationship('Evidence', backref='uploader', lazy=True)
