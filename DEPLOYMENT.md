# DEIMS Deployment Guide

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ (if building locally)
- Python 3.11+ (if running without Docker)
- MySQL 8.0+ (if running without Docker)

## Production Deployment via Docker

1. **Environment Setup**
   Copy `.env.example` to `.env` in the `server/` directory and configure the secrets.
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your production credentials
   ```

2. **Build and Start Containers**
   Run the following command from the project root:
   ```bash
   docker-compose up -d --build
   ```
   This will start:
   - `db`: MySQL database on port 3306.
   - `backend`: Flask API on port 5000.
   - `frontend`: React SPA served via Nginx on port 80.

3. **Initialize Database**
   Since auto-migrations are disabled in production, you must initialize the database manually:
   ```bash
   docker-compose exec backend python manage.py setup
   ```
   This will create all tables and seed the Super Admin user.

## CI/CD Pipeline
DEIMS includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs tests and builds the frontend on every push to the `main` branch.
