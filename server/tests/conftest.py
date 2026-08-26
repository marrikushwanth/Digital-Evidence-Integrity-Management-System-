import pytest
import tempfile
import os
import bcrypt
from app import create_app
from models.db import db
from models.user import Role, User

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'test_secret_key_1234567890123456'
    AES_SECRET_KEY = '12345678901234567890123456789012'
    UPLOAD_FOLDER = os.path.join(tempfile.gettempdir(), 'uploads')
    ENCRYPTED_FOLDER = os.path.join(tempfile.gettempdir(), 'encrypted')
    REPORTS_FOLDER = os.path.join(tempfile.gettempdir(), 'reports')

@pytest.fixture
def app():
    # Setup test app
    app = create_app(TestConfig)
    
    # Folders are created in app.py now
    
    with app.app_context():
        db.create_all()
        
        # Seed test roles
        roles = ['Super Admin', 'Admin', 'Investigator', 'Auditor', 'Editor', 'Viewer']
        for role_name in roles:
            db.session.add(Role(name=role_name))
        db.session.commit()
        
        # Seed test admin
        admin_role = Role.query.filter_by(name='Super Admin').first()
        hashed_pw = bcrypt.hashpw('adminpass'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = User(
            username='admin_test',
            email='admin@test.local',
            password_hash=hashed_pw,
            full_name='Admin Test',
            role_id=admin_role.id,
            status='Active'
        )
        db.session.add(admin)
        db.session.commit()
        
        yield app
        
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(client):
    response = client.post('/api/auth/login', json={
        'username': 'admin_test',
        'password': 'adminpass'
    })
    return response.json['data']['token']
