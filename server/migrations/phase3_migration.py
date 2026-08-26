import sys
import os
from sqlalchemy import text

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models.db import db

app = create_app()
with app.app_context():
    print("Starting Phase 3 Database Migration...")
    
    # Check if columns exist first
    inspector = db.inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns('evidence')]
    
    if 'blockchain_tx_hash' not in columns:
        db.session.execute(text('ALTER TABLE evidence ADD COLUMN blockchain_tx_hash VARCHAR(100)'))
        print("Added blockchain_tx_hash column.")
    else:
        print("blockchain_tx_hash column already exists.")
        
    if 'blockchain_status' not in columns:
        db.session.execute(text("ALTER TABLE evidence ADD COLUMN blockchain_status VARCHAR(50) DEFAULT 'PENDING'"))
        print("Added blockchain_status column.")
    else:
        print("blockchain_status column already exists.")
        
    db.session.commit()
    print("Phase 3 Migration completed successfully!")
