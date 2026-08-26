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
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.environ.get('DB_POOL_SIZE', 10)),
        'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', 3600)),
        'pool_pre_ping': True,
        'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', 20))
    }
    
    # File Uploads
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'uploads')
    ENCRYPTED_FOLDER = os.environ.get('ENCRYPTED_FOLDER', 'encrypted')
    REPORTS_FOLDER = os.environ.get('REPORTS_FOLDER', 'reports')
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 104857600)) # 100MB default

def validate_config(app):
    """
    Validates that the production configuration is secure and halts startup safely if not.
    """
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        # Ensure secret keys are set and not defaults
        secret = app.config.get('SECRET_KEY')
        if not secret or secret == 'default_secret_key':
            raise ValueError("CRITICAL: SECRET_KEY is not set or using insecure default in production!")
            
        aes_key = app.config.get('AES_SECRET_KEY')
        if not aes_key or aes_key == 'default_aes_key_32_bytes_length!!':
            raise ValueError("CRITICAL: AES_SECRET_KEY is not set or using insecure default in production!")
            
        if len(aes_key) != 32:
            raise ValueError("CRITICAL: AES_SECRET_KEY must be exactly 32 bytes long for AES-256!")
            
        # Ensure database is not using root without password
        db_pw = app.config.get('MYSQL_PASSWORD', '')
        if not db_pw:
            raise ValueError("CRITICAL: MYSQL_PASSWORD is empty in production!")
            
        # Ensure blockchain secrets are present
        bc_key = app.config.get('BLOCKCHAIN_PRIVATE_KEY', '')
        if not bc_key:
            print("WARNING: BLOCKCHAIN_PRIVATE_KEY is missing. Blockchain features may fail.")
