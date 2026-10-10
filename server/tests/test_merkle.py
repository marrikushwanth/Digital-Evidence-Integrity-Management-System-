import pytest
import hashlib
from services.merkle_service import MerkleTree, verify_merkle_proof

def test_empty_leaf_list_rejected():
    with pytest.raises(ValueError):
        MerkleTree([])

def test_single_leaf_produces_deterministic_root():
    h1 = hashlib.sha256(b"Evidence 1").hexdigest()
    tree = MerkleTree([h1])
    # For a single leaf, the root is the leaf itself (based on our tree building)
    # Wait, our _build_tree creates levels until len(current_level) <= 1
    # For 1 leaf, it's just [leaves], so root is the leaf itself
    assert tree.get_root() == h1

def test_two_leaves_produce_correct_root():
    h1 = hashlib.sha256(b"E1").hexdigest()
    h2 = hashlib.sha256(b"E2").hexdigest()
    tree = MerkleTree([h1, h2])
    expected = hashlib.sha256((h1 + h2).encode('utf-8')).hexdigest()
    assert tree.get_root() == expected

def test_four_leaves_produce_correct_root():
    h1 = hashlib.sha256(b"1").hexdigest()
    h2 = hashlib.sha256(b"2").hexdigest()
    h3 = hashlib.sha256(b"3").hexdigest()
    h4 = hashlib.sha256(b"4").hexdigest()
    
    h12 = hashlib.sha256((h1 + h2).encode('utf-8')).hexdigest()
    h34 = hashlib.sha256((h3 + h4).encode('utf-8')).hexdigest()
    expected = hashlib.sha256((h12 + h34).encode('utf-8')).hexdigest()
    
    tree = MerkleTree([h1, h2, h3, h4])
    assert tree.get_root() == expected

def test_odd_number_of_leaves():
    h1 = hashlib.sha256(b"1").hexdigest()
    h2 = hashlib.sha256(b"2").hexdigest()
    h3 = hashlib.sha256(b"3").hexdigest()
    
    h12 = hashlib.sha256((h1 + h2).encode('utf-8')).hexdigest()
    h33 = hashlib.sha256((h3 + h3).encode('utf-8')).hexdigest()
    expected = hashlib.sha256((h12 + h33).encode('utf-8')).hexdigest()
    
    tree = MerkleTree([h1, h2, h3])
    assert tree.get_root() == expected

def test_same_hashes_produce_same_root():
    hashes = [hashlib.sha256(str(i).encode()).hexdigest() for i in range(5)]
    tree1 = MerkleTree(hashes)
    tree2 = MerkleTree(hashes)
    assert tree1.get_root() == tree2.get_root()

def test_different_hashes_produce_different_root():
    hashes1 = [hashlib.sha256(str(i).encode()).hexdigest() for i in range(5)]
    hashes2 = [hashlib.sha256(str(i+1).encode()).hexdigest() for i in range(5)]
    tree1 = MerkleTree(hashes1)
    tree2 = MerkleTree(hashes2)
    assert tree1.get_root() != tree2.get_root()

def test_valid_proof_verifies_true():
    hashes = [hashlib.sha256(str(i).encode()).hexdigest() for i in range(5)]
    tree = MerkleTree(hashes)
    root = tree.get_root()
    proof = tree.get_proof(2) # proof for 3rd hash
    
    assert verify_merkle_proof(hashes[2], proof, root) == True

def test_modified_leaf_verifies_false():
    hashes = [hashlib.sha256(str(i).encode()).hexdigest() for i in range(5)]
    tree = MerkleTree(hashes)
    root = tree.get_root()
    proof = tree.get_proof(2)
    
    fake_leaf = hashlib.sha256(b"fake").hexdigest()
    assert verify_merkle_proof(fake_leaf, proof, root) == False

def test_modified_proof_verifies_false():
    hashes = [hashlib.sha256(str(i).encode()).hexdigest() for i in range(5)]
    tree = MerkleTree(hashes)
    root = tree.get_root()
    proof = tree.get_proof(2)
    
    # modify proof
    proof[0]["hash"] = hashlib.sha256(b"fake").hexdigest()
    assert verify_merkle_proof(hashes[2], proof, root) == False

def test_modified_root_verifies_false():
    hashes = [hashlib.sha256(str(i).encode()).hexdigest() for i in range(5)]
    tree = MerkleTree(hashes)
    root = tree.get_root()
    proof = tree.get_proof(2)
    
    fake_root = hashlib.sha256(b"fake").hexdigest()
    assert verify_merkle_proof(hashes[2], proof, fake_root) == False
