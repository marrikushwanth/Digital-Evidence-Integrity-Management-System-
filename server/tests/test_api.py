import pytest
import io

def test_login_success(client):
    response = client.post('/api/auth/login', json={
        'username': 'admin_test',
        'password': 'adminpass'
    })
    assert response.status_code == 200
    assert 'token' in response.json['data']

def test_login_failure(client):
    response = client.post('/api/auth/login', json={
        'username': 'admin_test',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    
def test_register_user(client):
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'new@test.local',
        'password': 'password123',
        'full_name': 'New User'
    })
    assert response.status_code == 201
    assert 'pending approval' in response.json['message']

def test_admin_create_user(client, admin_token):
    response = client.post('/api/users/', 
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'username': 'created_by_admin',
            'email': 'created@test.local',
            'password': 'password123',
            'full_name': 'Created User',
            'role': 'Investigator'
        }
    )
    assert response.status_code == 201

def test_get_users(client, admin_token):
    response = client.get('/api/users/', headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    assert len(response.json['data']['items']) > 0

def test_create_case(client, admin_token):
    response = client.post('/api/cases/', 
        headers={'Authorization': f'Bearer {admin_token}'},
        json={
            'title': 'Test Case',
            'description': 'A case for testing'
        }
    )
    assert response.status_code == 201
    assert response.json['data']['title'] == 'Test Case'

def test_evidence_upload(client, admin_token):
    # First create a case
    case_resp = client.post('/api/cases/', 
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'title': 'Upload Case'}
    )
    case_id = case_resp.json['data']['id']
    
    # Upload evidence
    data = {
        'case_id': case_id,
        'description': 'Test file',
        'file': (io.BytesIO(b'this is a test file content'), 'test.txt')
    }
    
    upload_resp = client.post('/api/evidence/',
        headers={'Authorization': f'Bearer {admin_token}'},
        data=data,
        content_type='multipart/form-data'
    )
    
    assert upload_resp.status_code == 201
    assert upload_resp.json['data']['original_name'] == 'test.txt'
    
def test_evidence_upload_dangerous_file(client, admin_token):
    case_resp = client.post('/api/cases/', 
        headers={'Authorization': f'Bearer {admin_token}'},
        json={'title': 'Upload Case 2'}
    )
    case_id = case_resp.json['data']['id']
    
    data = {
        'case_id': case_id,
        'file': (io.BytesIO(b'malicious content'), 'virus.exe')
    }
    
    upload_resp = client.post('/api/evidence/',
        headers={'Authorization': f'Bearer {admin_token}'},
        data=data,
        content_type='multipart/form-data'
    )
    
    assert upload_resp.status_code == 422
    assert 'Invalid file type' in upload_resp.json['message']
