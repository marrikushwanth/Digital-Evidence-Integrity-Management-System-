import os
import sys

# Add server directory to path so we can import models and config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models.db import db
from models.user import User
from models.auth import PasswordHistory, ActiveSession, ResetToken

def run_migration():
    app = create_app()
    with app.app_context():
        from sqlalchemy import text
        # Add new columns to users table
        try:
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN locked_until DATETIME;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN password_changed_at DATETIME;"))
                conn.commit()
            print("Successfully altered users table.")

        except Exception as e:
            print(f"Error altering users table (it might already have these columns): {e}")

        # Create new tables
        try:
            PasswordHistory.__table__.create(db.engine)
            ActiveSession.__table__.create(db.engine)
            ResetToken.__table__.create(db.engine)
            print("Successfully created auth tables.")
        except Exception as e:
            print(f"Error creating auth tables (they might already exist): {e}")

if __name__ == "__main__":
    run_migration()
