import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default_secret_key')
    AES_SECRET_KEY = os.environ.get('AES_SECRET_KEY', 'default_aes_key_32_bytes_length!!')
    
    # Blockchain
    BLOCKCHAIN_RPC_URL = os.environ.get('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:8545')
    BLOCKCHAIN_CONTRACT_ADDRESS = os.environ.get('BLOCKCHAIN_CONTRACT_ADDRESS', '')
    BLOCKCHAIN_PRIVATE_KEY = os.environ.get('BLOCKCHAIN_PRIVATE_KEY', '') # For backend signing
    
    # Database
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_PORT = os.environ.get('MYSQL_PORT', '3306')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE', 'DEIMS')
    
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File Uploads
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    ENCRYPTED_FOLDER = os.environ.get('ENCRYPTED_FOLDER', 'encrypted')
    REPORTS_FOLDER = os.environ.get('REPORTS_FOLDER', 'reports')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 104857600)) # 100MB default
