import os
import requests
import json
import time

BASE_URL = 'http://localhost:5000/api'

def get_token():
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "Password123!"
    })
    if res.status_code == 200:
        return res.json()['data']['access_token']
    else:
        print("Login failed:", res.text)
        return None

def upload_file(filename, content, token, case_id):
    with open(filename, 'wb') as f:
        f.write(content)
        
    with open(filename, 'rb') as f:
        files = {'file': (filename, f)}
        data = {'case_id': case_id}
        headers = {'Authorization': f'Bearer {token}'}
        res = requests.post(f"{BASE_URL}/evidence/", files=files, data=data, headers=headers)
        
    os.remove(filename)
    return res

def test_uploads():
    token = get_token()
    if not token:
        return

    # Assuming a case exists with ID, or we can just fetch one
    res = requests.get(f"{BASE_URL}/cases/", headers={'Authorization': f'Bearer {token}'})
    cases = res.json()['data']['items']
    if not cases:
        print("No cases found to upload to!")
        return
    case_id = cases[0]['id']

    print(f"Using case_id: {case_id}")

    # 1. Valid .ppt
    res1 = upload_file('test_valid.ppt', b'Fake PPT Content...', token, case_id)
    print("Valid .ppt upload:", res1.status_code, res1.text)

    # 2. Valid .pptx
    res2 = upload_file('test_valid.pptx', b'Fake PPTX Content...', token, case_id)
    print("Valid .pptx upload:", res2.status_code, res2.text)

    # 3. Unsupported extension
    res3 = upload_file('test_invalid.xyz', b'Fake XYZ Content...', token, case_id)
    print("Unsupported extension upload:", res3.status_code, res3.text)

    # 4. Unauthorized upload
    res4 = upload_file('unauth.ppt', b'Fake Content', 'invalid_token', case_id)
    print("Unauthorized upload:", res4.status_code, res4.text)

    # 5. Oversized PowerPoint file (simulated by frontend normally, but backend max is 100MB)
    # We won't generate a 101MB file here as it will take up disk/memory. The backend returns 413 for oversized files normally.

if __name__ == '__main__':
    test_uploads()
