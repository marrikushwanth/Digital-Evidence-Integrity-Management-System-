from .db import db
from datetime import datetime, timezone
from .user import generate_uuid

class MerkleBatch(db.Model):
    __tablename__ = 'merkle_batches'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    batch_id = db.Column(db.String(36), unique=True, default=generate_uuid)
    batch_name = db.Column(db.String(150), nullable=True)
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    merkle_root = db.Column(db.String(64), nullable=False)
    leaf_count = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='PENDING') # PENDING, FINALIZED
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    finalized_at = db.Column(db.DateTime, nullable=True)
    blockchain_tx_hash = db.Column(db.String(66), nullable=True)
    blockchain_status = db.Column(db.String(20), default='PENDING') # PENDING, REGISTERED, FAILED
    
    leaves = db.relationship('MerkleLeaf', backref='batch', lazy=True, cascade='all, delete-orphan')

class MerkleLeaf(db.Model):
    __tablename__ = 'merkle_leaves'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    batch_id = db.Column(db.String(36), db.ForeignKey('merkle_batches.id'), nullable=False)
    evidence_id = db.Column(db.String(36), db.ForeignKey('evidence.id'), nullable=False)
    leaf_hash = db.Column(db.String(64), nullable=False)
    leaf_index = db.Column(db.Integer, nullable=False)
