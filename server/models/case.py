from .db import db
from datetime import datetime, timezone
import uuid
from .user import generate_uuid

class Case(db.Model):
    __tablename__ = 'cases'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='Active') # 'Active', 'Closed'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    evidence = db.relationship('Evidence', backref='case', lazy=True, cascade='all, delete-orphan')
