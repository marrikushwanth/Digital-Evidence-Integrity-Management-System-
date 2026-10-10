import pytest
import os
import json
from models.db import db
from models.case import Case
from models.evidence import Evidence
from models.merkle import MerkleBatch, MerkleLeaf
from models.log import ChainOfCustody
from models.user import User

def test_pdf_endpoint_authentication(client):
    response = client.get('/api/reports/cases/123/pdf')
    assert response.status_code == 401

def test_unauthorized_access(client, app):
    with app.app_context():
        # The admin_test user is Super Admin, so let's create a regular user for this test
        from models.user import Role
        viewer_role = Role.query.filter_by(name='Viewer').first()
        viewer = User(username='viewer_test', email='v@test.local', password_hash='hash', full_name='Viewer Test', role_id=viewer_role.id)
        db.session.add(viewer)
        db.session.commit()
        
        # We need a token for the viewer
        from utils.auth_utils import generate_tokens
        token, _, _ = generate_tokens(viewer.id)
            
        case = Case(title='Test Case', description='Desc', created_by=viewer.id)
        db.session.add(case)
        db.session.commit()
        
        case_id = case.id
        
    response = client.get(f'/api/reports/cases/{case_id}/pdf', headers={'Authorization': f'Bearer {token}'})
    # Since it's a viewer and they are not the investigator (they are creator but not investigator? wait. The logic says if not Super Admin/Admin/Auditor, it checks if creator_id != id and investigator != username. Here creator_id == id so they MIGHT be allowed. Let's create a case owned by someone else)
    
    with app.app_context():
        admin = User.query.filter_by(username='admin_test').first()
        case2 = Case(title='Test Case 2', description='Desc', created_by=admin.id)
        db.session.add(case2)
        db.session.commit()
        case2_id = case2.id

    response = client.get(f'/api/reports/cases/{case2_id}/pdf', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 403

def test_authorized_report_generation(client, admin_token, app):
    with app.app_context():
        admin = User.query.filter_by(username='admin_test').first()
        case = Case(title='Test Case 1', description='Desc', created_by=admin.id)
        db.session.add(case)
        db.session.commit()
        case_id = case.id
    
    response = client.get(f'/api/reports/cases/{case_id}/pdf', headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    assert response.headers['Content-Type'] == 'application/pdf'
    assert 'DEIMS_Test_Case_1_Forensic_Report.pdf' in response.headers['Content-Disposition']
    assert len(response.data) > 0

def test_case_with_no_evidence(client, admin_token, app):
    with app.app_context():
        admin = User.query.filter_by(username='admin_test').first()
        case = Case(title='Empty Case', description='Desc', created_by=admin.id)
        db.session.add(case)
        db.session.commit()
        case_id = case.id
    
    response = client.get(f'/api/reports/cases/{case_id}/pdf', headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
    assert len(response.data) > 0

def test_case_with_evidence(client, admin_token, app):
    with app.app_context():
        admin = User.query.filter_by(username='admin_test').first()
        case = Case(title='Evidence Case', description='Desc', created_by=admin.id)
        db.session.add(case)
        db.session.commit()
        
        ev1 = Evidence(file_name='1.enc', original_name='test1.txt', file_size=100, file_hash='abc', case_id=case.id, uploaded_by=admin.id)
        ev2 = Evidence(file_name='2.enc', original_name='test2.txt', file_size=200, file_hash='def', case_id=case.id, uploaded_by=admin.id)
        db.session.add_all([ev1, ev2])
        db.session.commit()
        case_id = case.id
    
    response = client.get(f'/api/reports/cases/{case_id}/pdf', headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200

def test_case_with_merkle_and_logs(client, admin_token, app):
    with app.app_context():
        admin = User.query.filter_by(username='admin_test').first()
        case = Case(title='Complex Case', description='Desc', created_by=admin.id)
        db.session.add(case)
        db.session.commit()
        
        ev = Evidence(file_name='3.enc', original_name='test3.txt', file_size=300, file_hash='ghi', case_id=case.id, uploaded_by=admin.id)
        db.session.add(ev)
        db.session.commit()
        
        batch = MerkleBatch(batch_name='Batch 1', case_id=case.id, created_by=admin.id, merkle_root='root123', leaf_count=1)
        db.session.add(batch)
        db.session.commit()
        
        leaf = MerkleLeaf(batch_id=batch.id, evidence_id=ev.id, leaf_hash='ghi', leaf_index=0)
        coc = ChainOfCustody(case_id=case.id, evidence_id=ev.id, username='admin', role='Admin', action='Upload', status='SUCCESS')
        db.session.add_all([leaf, coc])
        db.session.commit()
        case_id = case.id
    
    response = client.get(f'/api/reports/cases/{case_id}/pdf', headers={'Authorization': f'Bearer {admin_token}'})
    assert response.status_code == 200
