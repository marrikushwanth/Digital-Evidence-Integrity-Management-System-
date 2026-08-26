import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
from flask import current_app

class CryptoService:
    @staticmethod
    def _get_key():
        key = current_app.config['AES_SECRET_KEY'].encode('utf-8')
        if len(key) != 32:
            # Pad or truncate to 32 bytes (256 bits) if necessary, though it should be 32
            key = key.ljust(32, b'\0')[:32]
        return key

    @staticmethod
    def encrypt_file(input_path, output_path):
        """Encrypts a file using AES-256-CBC."""
        key = CryptoService._get_key()
        iv = os.urandom(16)
        
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        padder = padding.PKCS7(algorithms.AES.block_size).padder()
        
        with open(input_path, 'rb') as f_in, open(output_path, 'wb') as f_out:
            f_out.write(iv) # Prepend IV to the output file
            
            while True:
                chunk = f_in.read(64 * 1024)
                if len(chunk) == 0:
                    break
                padded_chunk = padder.update(chunk)
                f_out.write(encryptor.update(padded_chunk))
                
            f_out.write(encryptor.update(padder.finalize()))
            f_out.write(encryptor.finalize())
            
    @staticmethod
    def decrypt_file(input_path, output_path):
        """Decrypts an AES-256-CBC encrypted file."""
        key = CryptoService._get_key()
        
        with open(input_path, 'rb') as f_in, open(output_path, 'wb') as f_out:
            iv = f_in.read(16) # Read the IV from the beginning
            
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            unpadder = padding.PKCS7(algorithms.AES.block_size).unpadder()
            
            while True:
                chunk = f_in.read(64 * 1024)
                if len(chunk) == 0:
                    break
                decrypted_chunk = decryptor.update(chunk)
                f_out.write(unpadder.update(decrypted_chunk))
                
            f_out.write(unpadder.update(decryptor.finalize()))
            f_out.write(unpadder.finalize())
