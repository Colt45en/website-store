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

Website demo
-----------

The repository now also contains a small static website demo useful for quick UI prototyping and for pushing from Visual Studio.

- `index.html` — static storefront page with product cards and a small cart UI
- `styles.css` — responsive styles
- `app.js` — simple cart backed by localStorage

Run the static demo locally:

```powershell
# from the repo root
npx http-server -c-1 . -p 5000
# then open http://localhost:5000
```

If you'd like me to open the pull request for the branch `feature/e2e-cleanup-ci`, say so and I'll create it (I can use the GitHub API if you provide a temporary PAT, or you can open the PR from the URL printed when pushing).
