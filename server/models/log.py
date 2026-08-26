from .db import db
from datetime import datetime
from .user import generate_uuid

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    username = db.Column(db.String(100))
    role = db.Column(db.String(50))
    ip_address = db.Column(db.String(45))
    browser = db.Column(db.String(255))
    os = db.Column(db.String(100))
    action = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    details = db.Column(db.Text)

class ChainOfCustody(db.Model):
    __tablename__ = 'chain_of_custody'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    evidence_id = db.Column(db.String(36), db.ForeignKey('evidence.id'), nullable=True)
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=True)
    username = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)
