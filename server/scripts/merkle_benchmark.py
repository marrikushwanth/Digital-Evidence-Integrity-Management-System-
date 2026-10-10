import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import time
import hashlib
import uuid
from app import create_app
from services.merkle_service import MerkleTree
from services.blockchain_service import blockchain_service

def run_benchmark():
    app = create_app()
    with app.app_context():
        if not blockchain_service.is_connected():
            print("Blockchain is not connected. Cannot run benchmark.")
            return

        sizes = [10, 25, 50, 100]
        
        print("="*50)
        print("MERKLE SCALABILITY BENCHMARK")
        print("="*50)
        
        for N in sizes:
            # 1. Generate N SHA-256 evidence hashes
            hashes = [hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest() for _ in range(N)]
            
            # 2. Build Merkle tree
            start_tree = time.time()
            tree = MerkleTree(hashes)
            root = tree.get_root()
            tree_time = time.time() - start_tree
            
            # 3. Register exactly ONE Merkle root transaction
            batch_id = str(uuid.uuid4())
            start_tx = time.time()
            res = blockchain_service.register_merkle_root(batch_id, root, N)
            tx_time = time.time() - start_tx
            
            if res.get('status') == 'REGISTERED':
                tx_hash = res.get('tx_hash')
                print(f"Batch Size (N): {N}")
                print(f"Leaf Count:     {N}")
                print(f"Merkle Root:    {root}")
                print(f"Tx Hash:        {tx_hash}")
                print(f"Tree Build:     {tree_time:.4f} s")
                print(f"Blockchain Tx:  {tx_time:.4f} s")
                # Wait, getting gas used requires getting the receipt again, 
                # but our register_merkle_root returns only status and tx_hash.
                # Let's fetch receipt to get gas
                receipt = blockchain_service.w3.eth.get_transaction_receipt(tx_hash)
                gas_used = receipt.gasUsed
                print(f"Gas Used:       {gas_used}")
            else:
                print(f"Failed for N={N}: {res.get('error')}")
            
            print("-" * 50)

if __name__ == '__main__':
    run_benchmark()
