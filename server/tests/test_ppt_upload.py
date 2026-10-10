import io
import pytest
from app import create_app, db
from models.evidence import Evidence
from models.case import Case

def test_ppt_uploads(client, admin_token):
    auth_headers = {'Authorization': f'Bearer {admin_token}'}
    # Create a case
    res = client.post('/api/cases/', json={
        'title': 'Test Case',
        'description': 'Test Case for PPT',
        'status': 'Open'
    }, headers=auth_headers)
    assert res.status_code == 201
    
    # Get a case ID
    res = client.get('/api/cases/', headers=auth_headers)
    assert res.status_code == 200
    cases = res.json['data']['items']
    assert len(cases) > 0
    case_id = cases[0]['id']
    
    # 1. Valid .ppt
    data1 = {
        'case_id': case_id,
        'file': (io.BytesIO(b"dummy ppt content"), 'presentation.ppt')
    }
    res1 = client.post('/api/evidence/', data=data1, headers=auth_headers, content_type='multipart/form-data')
    assert res1.status_code == 201
    assert 'presentation.ppt' in res1.json['data']['original_name']
    print("\nValid .ppt upload successful.")

    # 2. Valid .pptx
    data2 = {
        'case_id': case_id,
        'file': (io.BytesIO(b"dummy pptx content"), 'presentation.pptx')
    }
    res2 = client.post('/api/evidence/', data=data2, headers=auth_headers, content_type='multipart/form-data')
    assert res2.status_code == 201
    assert 'presentation.pptx' in res2.json['data']['original_name']
    print("Valid .pptx upload successful.")
    
    # 3. Unsupported extension
    data3 = {
        'case_id': case_id,
        'file': (io.BytesIO(b"dummy bad content"), 'badfile.xyz')
    }
    res3 = client.post('/api/evidence/', data=data3, headers=auth_headers, content_type='multipart/form-data')
    assert res3.status_code == 422
    print("Unsupported extension rejected.")
    
    # 4. Unauthorized upload (no headers)
    data4 = {
        'case_id': case_id,
        'file': (io.BytesIO(b"dummy ppt content"), 'presentation.ppt')
    }
    res4 = client.post('/api/evidence/', data=data4, content_type='multipart/form-data')
    assert res4.status_code == 401
    print("Unauthorized upload rejected.")
