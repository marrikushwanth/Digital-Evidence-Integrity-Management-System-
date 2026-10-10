import sys
import os

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models.db import db
from models.merkle import MerkleBatch, MerkleLeaf

def reset_merkle_data():
    print("Connecting to DEIMS MySQL database...")
    app = create_app()
    with app.app_context():
        # Get counts before deletion
        batches_count = MerkleBatch.query.count()
        leaves_count = MerkleLeaf.query.count()
        
        print(f"Number of Merkle batches: {batches_count}")
        print(f"Number of Merkle leaves: {leaves_count}")
        
        # Check for explicit confirmation
        if len(sys.argv) > 1 and sys.argv[1] == "RESET MERKLE DATA":
            print("Executing safe deletion...")
            
            # Delete children first
            MerkleLeaf.query.delete()
            # Delete parents
            MerkleBatch.query.delete()
            db.session.commit()
            
            print("Merkle data reset successfully.")
            
            # Verify counts after deletion
            batches_count = MerkleBatch.query.count()
            leaves_count = MerkleLeaf.query.count()
            
            print(f"Remaining Merkle batches: {batches_count}")
            print(f"Remaining Merkle leaves: {leaves_count}")
        else:
            print("\nWARNING: This script will permanently delete all Merkle batches and leaves.")
            print("To execute the deletion, you must provide the exact confirmation argument:")
            print('python reset_merkle_data.py "RESET MERKLE DATA"')

if __name__ == "__main__":
    reset_merkle_data()
