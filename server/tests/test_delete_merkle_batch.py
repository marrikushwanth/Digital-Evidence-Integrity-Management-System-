import pytest
from app import create_app, db
from models.merkle import MerkleBatch
from models.case import Case

def test_delete_pending_merkle_batch(client, admin_token):
    auth_headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Create case
    res = client.post('/api/cases/', json={'title':'T','description':'D','status':'Open'}, headers=auth_headers)
    
    # Get case
    res = client.get('/api/cases/', headers=auth_headers)
    cases = res.json['data']['items']
    assert len(cases) > 0
    case_id = cases[0]['id']
    
    # Create batch manually (we need evidence, but we can just bypass and inject a DB record to test the deletion route itself safely)
    with client.application.app_context():
        batch = MerkleBatch(
            batch_name="Test Pending Batch",
            case_id=case_id,
            created_by="test-user",
            merkle_root="fake_root",
            leaf_count=0,
            status="PENDING"
        )
        db.session.add(batch)
        db.session.commit()
        batch_id = batch.batch_id
    
    # Now try deleting it
    res_del = client.delete(f'/api/merkle/batches/{batch_id}', headers=auth_headers)
    assert res_del.status_code == 200
    
    # Verify it is deleted physically
    with client.application.app_context():
        deleted = MerkleBatch.query.filter_by(batch_id=batch_id).first()
        assert deleted is None

def test_archive_finalized_merkle_batch(client, admin_token):
    auth_headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Create case
    res = client.post('/api/cases/', json={'title':'T','description':'D','status':'Open'}, headers=auth_headers)
    
    # Get case
    res = client.get('/api/cases/', headers=auth_headers)
    cases = res.json['data']['items']
    case_id = cases[0]['id']
    
    with client.application.app_context():
        batch = MerkleBatch(
            batch_name="Test Finalized Batch",
            case_id=case_id,
            created_by="test-user",
            merkle_root="fake_root_2",
            leaf_count=0,
            status="FINALIZED",
            blockchain_status="REGISTERED"
        )
        db.session.add(batch)
        db.session.commit()
        batch_id = batch.batch_id
        
    # Delete (archive) it
    res_del = client.delete(f'/api/merkle/batches/{batch_id}', headers=auth_headers)
    assert res_del.status_code == 200
    
    # Verify it is marked ARCHIVED, not physically deleted
    with client.application.app_context():
        archived = MerkleBatch.query.filter_by(batch_id=batch_id).first()
        assert archived is not None
        assert archived.status == 'ARCHIVED'
        
    # Verify it doesn't show in get_all_batches
    res_all = client.get('/api/merkle/batches', headers=auth_headers)
    assert res_all.status_code == 200
    for b in res_all.json['data']['batches']:
        assert b['id'] != batch_id
