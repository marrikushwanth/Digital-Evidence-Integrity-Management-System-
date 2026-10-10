from app import create_app
from models.db import db
from models.security import SecurityEvent
import os

def migrate():
    app = create_app()
    with app.app_context():
        print("Running Phase 4 Security Migration...")
        # Create the new table
        db.create_all()
        print("SecurityEvent table created successfully.")

if __name__ == '__main__':
    migrate()
