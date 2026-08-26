from .db import db
from datetime import datetime, timezone
from .user import generate_uuid

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    case_id = db.Column(db.String(36), db.ForeignKey('cases.id'), nullable=False)
    generated_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    generated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    file_path = db.Column(db.String(255), nullable=False)
