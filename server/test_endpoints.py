import json
from app import create_app
from models.db import db
from models.user import User, Role

app = create_app()

with app.app_context():
    # Find an admin or super admin role
    admin_roles = Role.query.filter(Role.name.in_(['Super Admin', 'Admin'])).all()
    if not admin_roles:
        print("No admin roles found")
        exit(1)
        
    role_ids = [r.id for r in admin_roles]
    admin = User.query.filter(User.role_id.in_(role_ids)).first()
    if not admin:
        print("No admin user found")
        exit(1)
        
    client = app.test_client()
    
    from utils.auth_utils import generate_tokens
    from models.auth import ActiveSession
    import datetime
    token, _, jti = generate_tokens(admin.id)
    session = ActiveSession(user_id=admin.id, session_token=jti, ip_address='127.0.0.1', user_agent='test', expires_at=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=1)) # type: ignore
    db.session.add(session)
    db.session.commit()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test GET /api/system/metrics
    res = client.get('/api/system/metrics', headers=headers)
    print("GET /api/system/metrics:", res.status_code)
    print("Response body:", res.get_data(as_text=True))
    
    # Test GET /api/cases/
    res = client.get('/api/cases/', headers=headers)
    print("GET /api/cases/:", res.status_code)
    
    # Test GET /api/evidence/
    res = client.get('/api/evidence/', headers=headers)
    print("GET /api/evidence/:", res.status_code)
    
    # Test GET /api/evidence/blockchain/status
    res = client.get('/api/evidence/blockchain/status', headers=headers)
    print("GET /api/evidence/blockchain/status:", res.status_code)
