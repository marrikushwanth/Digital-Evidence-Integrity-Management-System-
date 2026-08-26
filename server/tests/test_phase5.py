import pytest
from app import create_app
from models.db import db

@pytest.fixture(scope='module')
def app():
    app = create_app()
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test_secret_key',
        'AES_SECRET_KEY': 'this_is_a_32_byte_test_key_!!!!!'
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='module')
def client(app):
    return app.test_client()

def test_health_endpoint(client):
    """Test the basic /api/health endpoint"""
    response = client.get('/api/health/')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['application'] == 'healthy'

def test_database_health_endpoint(client):
    """Test the database health endpoint"""
    response = client.get('/api/health/database')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] is True
    assert data['data']['database'] == 'healthy'

from unittest.mock import patch

def test_blockchain_health_endpoint(client):
    """Test blockchain health, mocking the blockchain service"""
    with patch('routes.health_routes.verify_blockchain_connection', return_value=True):
        response = client.get('/api/health/blockchain')
        assert response.status_code == 200
        data = response.get_json()
        assert data['success'] is True

def test_metrics_unauthorized(client):
    """Test that metrics endpoint requires authentication"""
    response = client.get('/api/system/metrics')
    assert response.status_code == 401

def test_request_id_middleware(client):
    """Test that the Request ID is returned in headers"""
    response = client.get('/api/health/')
    assert 'X-Request-ID' in response.headers
