import os
import sys
from app import create_app
from models.db import db
import bcrypt

app = create_app()

def init_db():
    with app.app_context():
        # Import models
        from models import user, case, evidence, log, report, auth
        
        print("Creating database tables...")
        db.create_all()
        
        print("Running Phase 4 schema migrations (if any)...")
        try:
            db.session.execute("ALTER TABLE users ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT 1")
            db.session.commit()
            print("Added email_notifications_enabled column to users table.")
        except Exception:
            db.session.rollback()
            print("Column email_notifications_enabled already exists.")

        print("Database initialization complete.")

def seed_admin():
    with app.app_context():
        from models.user import Role, User
        from models.auth import PasswordHistory
        
        roles = ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer']
        for role_name in roles:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))
        
        db.session.commit()
        
        super_admin_role = Role.query.filter_by(name='Super Admin').first()
        super_admin = User.query.filter_by(username='kushwanth').first()
        
        if not super_admin:
            sa_password = os.environ.get('SUPER_ADMIN_PASSWORD', 'kushwanth')
            hashed_pw = bcrypt.hashpw(sa_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            super_admin = User(
                username='kushwanth',
                email='kushwanth@deims.local',
                password_hash=hashed_pw,
                full_name='Super Admin Kushwanth',
                role_id=super_admin_role.id,
                status='Active'
            )
            db.session.add(super_admin)
            db.session.commit()
            
            hist = PasswordHistory(user_id=super_admin.id, password_hash=hashed_pw)
            db.session.add(hist)
            db.session.commit()
            print("Super admin user seeded.")
        else:
            print("Super admin user already exists.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python manage.py [initdb|seed|setup]")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "initdb":
        init_db()
    elif command == "seed":
        seed_admin()
    elif command == "setup":
        init_db()
        seed_admin()
    else:
        print(f"Unknown command: {command}")
