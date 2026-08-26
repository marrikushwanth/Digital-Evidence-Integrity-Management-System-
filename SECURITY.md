# DEIMS Security Policies & Architecture

## Overview
The Digital Evidence Integrity Management System (DEIMS) is designed to handle highly sensitive forensic evidence. Security is baked into the platform at multiple layers: Network, Application, and Data.

## Key Security Features

### 1. Authentication & Identity
- **JWT (JSON Web Tokens)**: Used for stateless session management with strict expiration times.
- **MFA (Multi-Factor Authentication)**: Enforced via TOTP (Time-Based One-Time Passwords).
- **Password Policies**: Requires high-entropy passwords. Enforces lockout after 5 failed attempts (15-minute lock).
- **Session Tracking**: Active sessions are tracked in the database and invalidated on logout or timeout.

### 2. Encryption & Data at Rest
- **File Encryption**: All uploaded evidence files are immediately encrypted on disk using AES-256.
- **Key Management**: The `AES_SECRET_KEY` must be securely injected via environment variables.

### 3. Data Integrity & Non-Repudiation (Blockchain)
- **Hashing**: SHA-256 hashes of all evidence are computed upon upload.
- **Smart Contracts**: Hashes, submitter ID, and timestamps are anchored to an Ethereum-based blockchain.
- **Chain of Custody**: Every interaction (view, download, verify) is immutably recorded both in the MySQL database and on the blockchain.

### 4. Application Hardening
- **CORS**: Strictly limited to defined `ALLOWED_ORIGINS`.
- **Rate Limiting**: Applied to authentication routes to prevent brute-force attacks.
- **Security Headers**: HSTS, X-Content-Type-Options, X-Frame-Options, and X-XSS-Protection are enforced by the Flask backend.

### 5. Structured Auditing & Traceability
- **X-Request-ID**: Injected into all requests to correlate logs across services.
- **Immutable Audit Logs**: Action logs stored in the database are appended, not modified.

## Reporting Vulnerabilities
If you discover a security vulnerability in DEIMS, please do not disclose it publicly. Contact the System Administrator immediately.
