import sys
import os

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models.db import db
from models.merkle import MerkleBatch, MerkleLeaf
from sqlalchemy import inspect

def safe_migrate():
    app = create_app()
    with app.app_context():
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        
        migrated = False
        
        if 'merkle_batches' not in existing_tables:
            print("Creating 'merkle_batches' table...")
            MerkleBatch.__table__.create(db.engine)
            migrated = True
        else:
            print("'merkle_batches' already exists.")
            
        if 'merkle_leaves' not in existing_tables:
            print("Creating 'merkle_leaves' table...")
            MerkleLeaf.__table__.create(db.engine)
            migrated = True
        else:
            print("'merkle_leaves' already exists.")
            
        if migrated:
            print("Migration complete. The Merkle tables are now active in the database.")
        else:
            print("No migration needed. The Merkle tables already exist.")

if __name__ == "__main__":
    safe_migrate()
