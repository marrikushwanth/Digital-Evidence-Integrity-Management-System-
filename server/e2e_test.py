import requests
import json
import time

BASE_URL = 'http://localhost:5000/api'
import random

FILE_PATH = '../dummy_evidence_rand.txt'
with open(FILE_PATH, 'w') as f:
    f.write(f"Random Evidence: {random.randint(1, 100000)}")

# 1. Login
print("Logging in...")
res = requests.post(f"{BASE_URL}/auth/login", json={"username": "kushwanth", "password": "kushwanth"})
token = res.json()['data']['token']
headers = {"Authorization": f"Bearer {token}"}

# 2. Create Case
print("Creating case...")
res = requests.post(f"{BASE_URL}/cases/", json={"title": "E2E Programmatic Case", "description": "Testing E2E"}, headers=headers)
case_id = res.json()['data']['id']
print(f"Case ID: {case_id}")

# 3. Upload Evidence
print("Uploading evidence...")
with open(FILE_PATH, 'rb') as f:
    files = {'file': f}
    data = {'case_id': case_id, 'description': 'Original Evidence'}
    res = requests.post(f"{BASE_URL}/evidence/", files=files, data=data, headers=headers)
    if res.status_code != 200 and res.status_code != 201:
        print("Upload Error:", res.text)
        exit(1)
        exit(1)
        
upload_data = res.json()
print("Upload Result:", json.dumps(upload_data, indent=2))
evidence_id = upload_data['data']['id']
original_hash = upload_data['data']['file_hash']
print(f"Uploaded hash: {original_hash}")

# Wait a moment for blockchain to process fully
time.sleep(2)

# 4. Verify Original Evidence
print("\nVerifying original evidence...")
with open(FILE_PATH, 'rb') as f:
    files = {'file': f}
    data = {'evidence_id': evidence_id}
    res = requests.post(f"{BASE_URL}/evidence/verify", files=files, data=data, headers=headers)
    
verify_data = res.json()
print("Verify Result:", json.dumps(verify_data, indent=2))

# 5. Tamper Evidence
print("\nTampering evidence locally...")
with open("tampered_evidence.txt", "w") as f:
    f.write("This is a digital evidence file for Phase 3 Blockchain Integration testing. TAMPERED!")

# 6. Verify Tampered Evidence
print("\nVerifying tampered evidence...")
with open("tampered_evidence.txt", 'rb') as f:
    files = {'file': f}
    data = {'evidence_id': evidence_id}
    res = requests.post(f"{BASE_URL}/evidence/verify", files=files, data=data, headers=headers)
    
tamper_verify_data = res.json()
print("Tampered Verify Result:", json.dumps(tamper_verify_data, indent=2))

# 7. Check Audit Logs & Custody
print("\nChecking Audit Logs...")
res = requests.get(f"{BASE_URL}/logs/audit", headers=headers)
logs = res.json()['data']['items']
for log in logs[:10]:
    print(f"- {log['action']}: {log['details']}")

print("\nChecking Chain of Custody...")
res = requests.get(f"{BASE_URL}/logs/custody", headers=headers)
custody = res.json()['data']['items']
for c in custody[:5]:
    print(f"- {c['action']} (Evidence {c['evidence_id']}, Case {c['case_id']})")
