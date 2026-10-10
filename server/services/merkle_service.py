import hashlib

class MerkleTree:
    def __init__(self, leaves):
        if not leaves:
            raise ValueError("Leaves cannot be empty")
        self.leaves = leaves
        self.tree = self._build_tree(leaves)

    def _build_tree(self, leaves):
        tree = [leaves]
        current_level = leaves
        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                right = current_level[i + 1] if i + 1 < len(current_level) else current_level[i]
                combined = left + right
                next_level.append(hashlib.sha256(combined.encode('utf-8')).hexdigest())
            tree.append(next_level)
            current_level = next_level
        return tree

    def get_root(self):
        return self.tree[-1][0]

    def get_proof(self, leaf_index):
        if leaf_index < 0 or leaf_index >= len(self.leaves):
            raise IndexError("Leaf index out of bounds")
        
        proof = []
        current_index = leaf_index
        for level in range(len(self.tree) - 1):
            is_right_node = current_index % 2 == 1
            sibling_index = current_index - 1 if is_right_node else current_index + 1
            
            if sibling_index < len(self.tree[level]):
                proof.append({
                    "hash": self.tree[level][sibling_index],
                    "direction": "left" if is_right_node else "right"
                })
            else:
                proof.append({
                    "hash": self.tree[level][current_index],
                    "direction": "right" # Duplicated node acts as right sibling
                })
                
            current_index //= 2
            
        return proof

def verify_merkle_proof(leaf_hash, proof, merkle_root):
    current_hash = leaf_hash
    
    for item in proof:
        sibling_hash = item["hash"]
        direction = item["direction"]
        
        if direction == "left":
            combined = sibling_hash + current_hash
        else:
            combined = current_hash + sibling_hash
            
        current_hash = hashlib.sha256(combined.encode('utf-8')).hexdigest()
        
    return current_hash == merkle_root
