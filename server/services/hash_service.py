import os
import hashlib

class HashService:
    @staticmethod
    def generate_sha256(file_path):
        """Generates SHA-256 hash for a given file."""
        sha256_hash = hashlib.sha256()
        try:
            with open(file_path, "rb") as f:
                # Read and update hash string value in blocks of 4K
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except FileNotFoundError:
            return None

    @staticmethod
    def verify_sha256(file_path, expected_hash):
        """Verifies if the file's hash matches the expected hash."""
        actual_hash = HashService.generate_sha256(file_path)
        return actual_hash == expected_hash
