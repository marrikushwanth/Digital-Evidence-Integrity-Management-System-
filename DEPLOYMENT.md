# DEIMS Deployment Guide

DEIMS contains three separately hosted components: the React/Vite frontend, the Flask API, and the blockchain RPC network. Vercel is used for the frontend. Do not store forensic evidence in Vercel's function filesystem; it is ephemeral.

## 1. Deploy the frontend to Vercel

1. Open https://vercel.com/new and import `marrikushwanth/Digital-Evidence-Integrity-Management-System-`.
2. In **Root Directory**, choose `client`.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`. Install command: `npm install`.
4. Add an environment variable named `VITE_API_URL` with the public URL of the deployed API, ending with `/api` (for example, `https://your-api-host.example.com/api`). Do not use localhost.
5. Deploy. The `client/vercel.json` file rewrites SPA routes to `index.html`.

The frontend build can be deployed before the API is configured, but login, upload, and other API-backed features will not work until the API URL points to a live backend.

## 2. Host the Flask backend, persistent files, and database

The backend requires Python 3.11+, a reachable MySQL database, and durable private storage for uploaded/encrypted evidence and generated reports. Use a container-capable host with persistent disk/object storage for the Flask API (the repository has `server/Dockerfile`), managed MySQL for the database, and private persistent/object storage for evidence. Configure the backend's `UPLOAD_FOLDER`, `ENCRYPTED_FOLDER`, and `REPORTS_FOLDER` appropriately for that storage. A normal Vercel Python Function does not provide a persistent local filesystem and should not be used as the evidence store.

Configure these backend environment variables from `server/.env.example` in the hosting provider's secret/environment settings: `FLASK_ENV=production`, `SECRET_KEY`, `AES_SECRET_KEY` (exactly 32 characters), `SUPER_ADMIN_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `ALLOWED_ORIGINS` (your exact Vercel production URL), and blockchain variables `BLOCKCHAIN_RPC_URL`, `BLOCKCHAIN_CONTRACT_ADDRESS`, and `BLOCKCHAIN_PRIVATE_KEY` only if using on-chain transactions. Never commit actual secrets.

## 3. Database and evidence readiness

Initialize the production schema using the project's supported migrations/setup process before accepting traffic. Confirm that the initial Super Admin password is strong and change any development/default credentials. Test login, roles, case creation, evidence upload/download, hash verification, audit logs, and report downloads after deployment.

## 4. Blockchain

A local Hardhat development node is not a public production blockchain. If on-chain integrity is required, deploy the contract to a supported network or managed RPC, then set the contract address and RPC URL in the API environment. Keep the signing private key only in backend secrets, never in the browser.

## Local Docker deployment

For local development, configure environment variables, then run `docker compose up -d --build`. The Compose stack starts MySQL, the Flask backend, and the Nginx frontend. Do not assume this local Docker command deploys to Vercel.

## Notes

- Frontend environment variables prefixed with `VITE_` are bundled into public browser code. Only the API base URL belongs there; never put database passwords, AES keys, JWT secrets, or blockchain private keys in frontend variables.
- Vercel's frontend and API backend are separate deployments. CORS must allow the final frontend origin.
