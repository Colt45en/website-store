# Nova Store (dev notes)

See `server/tests/README.md` for instructions on the small e2e helper scripts that can start the server, run a demo append test, and tear down the server. The CI workflow runs these scripts and uploads logs on failure.

Quick commands
--------------
- Run client tests:

```powershell
cd client
npm test
```

- Run server e2e auto-runner locally:

```powershell
cd server
npm run e2e:auto
```
Nova Store — Local demo

This repository contains a minimal demo full-stack "Nova" store.

Server
1. cd nova-store/server
2. npm install
3. npm start (runs on http://localhost:4000)

Client
1. cd nova-store/client
2. npm install
3. npm run dev (Vite dev server on http://localhost:5173)

Demo credentials: demo@nova.local / password

The client includes:
- Landing page (Nova branding)
- Sign-in page (connects to server)
- Store page (lists products)
- Client Hub / Dashboard after sign-in

This is a starter scaffold; replace in-memory server data with a real DB and secure auth for production.
