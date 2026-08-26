from .db import db
from datetime import datetime, timezone
from .user import generate_uuid

class Evidence(db.Model):
    __tablename__ = 'evidence'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    file_name = db.Column(db.String(255), nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100))
    file_hash = db.Column(db.String(64), nullable=False) # SHA-256
    description = db.Column(db.Text)
    
    # Blockchain Fields
    blockchain_tx_hash = db.Column(db.String(66), nullable=True) # 0x + 64 hex chars
    blockchain_status = db.Column(db.String(20), default='PENDING') # PENDING, REGISTERED, FAILED
    
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=False)
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    chain_of_custody = db.relationship('ChainOfCustody', backref='evidence_ref', lazy=True, cascade='all, delete-orphan')
