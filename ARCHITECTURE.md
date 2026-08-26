# DEIMS Architecture

## High-Level Architecture
DEIMS follows a modern 3-tier web architecture augmented with a blockchain component for immutable evidence verification.

### 1. Presentation Layer (Frontend)
- **Framework**: React.js
- **Styling**: Tailwind CSS (Custom SOC/Hacker Theme)
- **State Management**: React Context API (`AppContext.jsx`)
- **Routing**: React Router DOM

### 2. Application Layer (Backend)
- **Framework**: Python / Flask
- **ORM**: SQLAlchemy
- **Authentication**: Flask-JWT-Extended & bcrypt for passwords
- **Security**: Flask-Limiter for rate limiting, Flask-CORS, and custom Security Header middlewares.

### 3. Data Layer
- **Relational DB**: MySQL (Managed via SQLAlchemy models). Stores Cases, Users, Audit Logs, and Metadata.
- **File System**: AES-256 encrypted evidence stored locally in the `encrypted` directory.

### 4. Immutable Ledger (Blockchain)
- **Network**: Local Hardhat Node / Ethereum Network
- **Smart Contract**: Solidity-based `EvidenceRegistry`
- **Integration**: Web3.py (`blockchain_service.py`) connects the Python backend to the node. Handles transactions and state calls to record and verify evidence hashes and chain-of-custody.

## Flow Diagrams
- **Upload**: User -> Frontend -> API -> File Encrypted & Saved -> Hash Generated -> Tx sent to Blockchain -> DB Updated.
- **Verification**: User -> Frontend -> API -> Retrieve File -> Hash File -> Query Blockchain -> Compare Hashes -> Return result.
