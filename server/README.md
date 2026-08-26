# DEIMS Backend Server (Phase 2 Completed)

This is the Python Flask backend for the Digital Evidence Integrity Management System (DEIMS).
It handles authentication, case management, digital evidence ingestion with cryptographic integrity (AES-256 and SHA-256), and automated chain-of-custody tracking.

## Technology Stack
- **Python 3 / Flask**: Backend Web Framework
- **MySQL / SQLAlchemy**: Database and ORM
- **JWT (PyJWT)**: Secure Token Authentication
- **bcrypt**: Password Hashing
- **cryptography**: AES-256 Encryption
- **ReportLab**: PDF Report Generation
- **pytest**: Automated API Testing

## Features
- Modular Controller-Route Architecture
- Role-Based Access Control (RBAC)
- Search, Filter, and Pagination for all major entities
- Strict File Type & MIME validation against malicious uploads
- Comprehensive Chain of Custody tracking

## Setup Instructions

### 1. Database Creation
Ensure your MySQL server is running. Create the database:
```sql
CREATE DATABASE DEIMS;
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
```

### 4. Run the Server
```bash
python app.py
```
On the first run, the system will auto-seed the `kushwanth` Super Admin account.

### 5. Running API Tests
A `pytest` suite is included to validate the endpoints:
```bash
python -m pytest tests/test_api.py -v
```
