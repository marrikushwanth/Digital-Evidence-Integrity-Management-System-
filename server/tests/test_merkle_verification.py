import io
import pytest
from app import create_app, db
from models.evidence import Evidence
from models.case import Case
from models.merkle import MerkleBatch, MerkleLeaf

def test_merkle_batch_verification(client, admin_token):
    auth_headers = {'Authorization': f'Bearer {admin_token}'}
    
    # 0. Create case
    res = client.post('/api/cases/', json={'title':'Verification Test','description':'D','status':'Open'}, headers=auth_headers)
    res = client.get('/api/cases/', headers=auth_headers)
    cases = res.json['data']['items']
    case_id = cases[0]['id']
    
    # Upload Evidence 1
    res = client.post('/api/evidence/', data={'case_id': case_id, 'file': (io.BytesIO(b"content 1"), 'file1.txt')}, headers=auth_headers, content_type='multipart/form-data')
    ev1_id = res.json['data']['id']
    
    # Upload Evidence 2
    res = client.post('/api/evidence/', data={'case_id': case_id, 'file': (io.BytesIO(b"content 2"), 'file2.txt')}, headers=auth_headers, content_type='multipart/form-data')
    ev2_id = res.json['data']['id']
    
    # Upload Evidence 3 (Same filename as Ev 2, different content)
    res = client.post('/api/evidence/', data={'case_id': case_id, 'file': (io.BytesIO(b"content 3"), 'file2.txt')}, headers=auth_headers, content_type='multipart/form-data')
    ev3_id = res.json['data']['id']
    
    # Create batch
    res = client.post('/api/merkle/batches', json={'batch_name': 'Test Batch Verify', 'evidence_ids': [ev1_id, ev2_id, ev3_id]}, headers=auth_headers)
    assert res.status_code == 201
    batch_id = res.json['data']['id']
    original_root = res.json['data']['merkle_root']
    
    # Upload Evidence 4 (File from another batch)
    res = client.post('/api/evidence/', data={'case_id': case_id, 'file': (io.BytesIO(b"content 4"), 'file4.txt')}, headers=auth_headers, content_type='multipart/form-data')
    
    # Verify All Original Files Supplied
    data = {
        'files[]': [
            (io.BytesIO(b"content 1"), 'file1.txt'),
            (io.BytesIO(b"content 2"), 'file2.txt'),
            (io.BytesIO(b"content 3"), 'file2.txt')
        ]
    }
    res = client.post(f'/api/merkle/batches/{batch_id}/verify-uploaded', data=data, headers=auth_headers, content_type='multipart/form-data')
    assert res.status_code == 200
    assert res.json['data']['overall_status'] == 'FULLY VERIFIED'
    assert res.json['data']['verified_files'] == 3
    
    # Verify One file missing
    data = {
        'files[]': [
            (io.BytesIO(b"content 1"), 'file1.txt'),
            (io.BytesIO(b"content 2"), 'file2.txt')
        ]
    }
    res = client.post(f'/api/merkle/batches/{batch_id}/verify-uploaded', data=data, headers=auth_headers, content_type='multipart/form-data')
    assert res.json['data']['overall_status'] == 'PARTIAL VERIFICATION'
    assert res.json['data']['not_provided'] == 1
    
    # Verify One modified file
    data = {
        'files[]': [
            (io.BytesIO(b"content 1"), 'file1.txt'),
            (io.BytesIO(b"content 2 modified"), 'file2.txt'),
            (io.BytesIO(b"content 3"), 'file2.txt')
        ]
    }
    res = client.post(f'/api/merkle/batches/{batch_id}/verify-uploaded', data=data, headers=auth_headers, content_type='multipart/form-data')
    assert res.json['data']['overall_status'] == 'INTEGRITY FAILURE'
    assert res.json['data']['failed_files'] == 1
    
    # Verify A file from another batch
    data = {
        'files[]': [
            (io.BytesIO(b"content 1"), 'file1.txt'),
            (io.BytesIO(b"content 2"), 'file2.txt'),
            (io.BytesIO(b"content 3"), 'file2.txt'),
            (io.BytesIO(b"content 4"), 'file4.txt')
        ]
    }
    res = client.post(f'/api/merkle/batches/{batch_id}/verify-uploaded', data=data, headers=auth_headers, content_type='multipart/form-data')
    assert res.json['data']['overall_status'] == 'FULLY VERIFIED' # Extra files don't fail the batch! Wait, actually it just returns extra count.
    assert res.json['data']['extra_count'] == 1
    
    # Verify A renamed file with unchanged contents
    data = {
        'files[]': [
            (io.BytesIO(b"content 1"), 'renamed1.txt'),
            (io.BytesIO(b"content 2"), 'file2.txt'),
            (io.BytesIO(b"content 3"), 'file2.txt')
        ]
    }
    res = client.post(f'/api/merkle/batches/{batch_id}/verify-uploaded', data=data, headers=auth_headers, content_type='multipart/form-data')
    assert res.json['data']['overall_status'] == 'FULLY VERIFIED'
    assert res.json['data']['verified_files'] == 3
    
    # Confirm Merkle root remains unchanged
    with client.application.app_context():
        batch = MerkleBatch.query.filter_by(batch_id=batch_id).first()
        assert batch.merkle_root == original_root
        
    print("Verification tests passed")
