import io
import pytest
from app import create_app, db
from models.evidence import Evidence
from models.case import Case

def test_duplicate_upload_workflow(client, admin_token):
    auth_headers = {'Authorization': f'Bearer {admin_token}'}
    
    # 0. Create case
    res = client.post('/api/cases/', json={'title':'T','description':'D','status':'Open'}, headers=auth_headers)
    
    # Get case
    res = client.get('/api/cases/', headers=auth_headers)
    cases = res.json['data']['items']
    assert len(cases) > 0
    case_id = cases[0]['id']
    
    # 1. Upload a new file
    data1 = {
        'case_id': case_id,
        'file': (io.BytesIO(b"duplicate test content 123"), 'dupe_test.txt')
    }
    res1 = client.post('/api/evidence/', data=data1, headers=auth_headers, content_type='multipart/form-data')
    assert res1.status_code == 201
    
    # 2. Confirm that a SHA-256 hash is stored
    ev1_id = res1.json['data']['id']
    with client.application.app_context():
        ev1 = Evidence.query.get(ev1_id)
        assert ev1 is not None
        file_hash = ev1.file_hash
        
    # 3. Upload the same file while the first record is active
    data2 = {
        'case_id': case_id,
        'file': (io.BytesIO(b"duplicate test content 123"), 'dupe_test.txt')
    }
    res2 = client.post('/api/evidence/', data=data2, headers=auth_headers, content_type='multipart/form-data')
    
    # 4. Confirm that the active duplicate is rejected (409 Conflict)
    assert res2.status_code == 409
    
    # 5. Delete the first record
    res_del = client.delete(f'/api/evidence/{ev1_id}', headers=auth_headers)
    assert res_del.status_code == 200
    
    # 6. Upload the exact same file again
    data3 = {
        'case_id': case_id,
        'file': (io.BytesIO(b"duplicate test content 123"), 'dupe_test.txt')
    }
    res3 = client.post('/api/evidence/', data=data3, headers=auth_headers, content_type='multipart/form-data')
    
    # 7. Confirm that re-upload is permitted (201 Created)
    assert res3.status_code == 201
    
    # 8. Confirm that a new evidence ID is generated
    ev2_id = res3.json['data']['id']
    assert ev2_id != ev1_id
    
    # 9. Confirm that the original hash is unchanged
    with client.application.app_context():
        ev2 = Evidence.query.get(ev2_id)
        assert ev2.file_hash == file_hash
        assert ev2.file_name.endswith('.enc')
        assert ev2.file_name != ev1.file_name  # New UUID file name used instead of hash!

        # 10. Confirm old record still exists as deleted
        old_ev = Evidence.query.get(ev1_id)
        assert old_ev is not None
        assert old_ev.status == 'DELETED'
        
    print("\nDuplicate evidence handling workflow test passed successfully.")
