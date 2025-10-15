E2E test scripts
=================

This folder contains helper scripts for running small end-to-end tests against the local server.

Scripts
-------
- `e2e_append_test.js` - simple script that assumes the server is running on `localhost:4000`. It requests a demo token (`/api/auth/demo`) and posts a sample chat append to `/api/chat/append`.
- `e2e_with_server.js` - more robust runner that will start the server if it's not running, wait for readiness, run an append test, and then tear down any spawned server process.

Behavior & assumptions
----------------------
- Default server host/port: `127.0.0.1:4000`.
- The runner will use the logical start command from `package.json` (i.e. `npm start`) to spawn the server. This keeps the runner resilient to changes in how the server is started (for example, using a wrapper, ts-node, or different entrypoint).
- On Windows the runner spawns `npm.cmd start`; on POSIX it spawns `npm start`.
- Readiness waiting: the runner polls the port with a default timeout of ~30s (120 attempts × 250ms). You can adjust the timeout in the script if your environment needs more time.
- Teardown: the runner attempts a graceful `child.kill()`. If the process does not exit, it uses `taskkill` on Windows or `SIGKILL` on POSIX as a fallback.

CI integration
--------------
The repository contains a GitHub Actions workflow (`.github/workflows/e2e.yml`) which runs `npm run e2e:auto` in the `server` folder. The workflow captures stdout/stderr to `server/e2e-output.txt` and uploads it as an artifact; the job fails if the runner returns a non-zero exit code.

Environment variables
---------------------
- If your server uses a different port or requires environment variables, set them in the environment before running the scripts or modify the script to pass them to the spawned process. For CI, set secrets or env vars using the workflow file.

Notes
-----
- Prefer using the logical start script (`npm start` or `npm run start:dev`) when adding new runner scripts or CI jobs. This keeps the runner decoupled from a specific entry file path.
- If you want the runner to use a different package script (e.g., `start:dev`), update `e2e_with_server.js` accordingly or pass a flag/env var to the runner.

Test cleanup (safe defaults)
---------------------------
The repository includes a protected test cleanup endpoint `POST /api/test/cleanup` intended for CI and test automation to remove transient test users and associated data.

Safety gates:
- The endpoint is only active when `TEST_CLEANUP_ENABLED=1` AND either `NODE_ENV=test` OR the server detects `GITHUB_ACTIONS=true`.
- The endpoint requires admin authentication (the demo account `demo@nova.local`).
- Additionally, the endpoint requires a secret token matched by `TEST_CLEANUP_TOKEN`. The token must be supplied by the caller using the HTTP header `x-test-cleanup-token` or in the request body as `token`.

How CI uses it:
- The workflow includes a matrix job that sets `START_WITH_REGISTER=true` and passes `TEST_CLEANUP_ENABLED=1` plus `TEST_CLEANUP_TOKEN` (from GitHub Secrets) into the runner. The runner will then register a test user and ask the server to clean up those users after the test run.

Running the integration check locally
- To run the integration test locally, start the server with the cleanup envs and then run the test. Example (PowerShell):

```powershell
# from the server folder
$env:TEST_CLEANUP_ENABLED='1'
$env:TEST_CLEANUP_TOKEN='your-local-token'
$env:NODE_ENV='test'
npm run start:cleanup   # starts the server with TEST_CLEANUP_ENABLED and NODE_ENV=test

# in a second shell run the test
node .\tests\cleanup_integration_test.js
```

Note: the `start:cleanup` and `test-cleanup` npm scripts no longer embed a token; you must supply `TEST_CLEANUP_TOKEN` via your shell or CI secrets. This avoids accidental disclosure of secrets in repository files.

This script will register a user, verify presence in `mockdb.json`, call the cleanup endpoint (using the demo admin token), and assert that the user was removed.

If you prefer extra safety, set `TEST_CLEANUP_ENABLED` only in CI, or supplement with a secret that exists only in your CI provider.

CI note
-------
If your repository sets the `TEST_CLEANUP_TOKEN` secret, the GitHub Actions workflow will run an extra job `cleanup-integration` that starts the server with cleanup enabled and runs the integration test. This job is gated by the presence of the secret to avoid accidental runs in forks.
