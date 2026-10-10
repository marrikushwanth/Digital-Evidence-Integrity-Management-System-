import os
import io
from app import create_app, db
from models.evidence import Evidence
from models.case import Case
from models.user import User
from services.hash_service import HashService
import uuid

def test_ppt_uploads():
    app = create_app()
    with app.app_context():
        user = User.query.first()
        if not user:
            print("No user found")
            return
            
        case = Case.query.first()
        if not case:
            print("No case found")
            return
            
        print(f"Testing upload as user {user.username} for case {case.id}")
        
        # We simulate the Flask test client
        with app.test_client() as client:
            # We must login to get token
            # Actually, simpler: we can just use the upload_evidence method directly
            # but it uses `g.user.id`. Better to use the test client and bypass auth or login
            pass

if __name__ == "__main__":
    test_ppt_uploads()
