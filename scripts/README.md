PowerShell helper scripts for local testing

Files:
- temp_post_chat.ps1 - posts a full conversation payload to /api/chat (authenticated demo user)
- append_and_mark.ps1 - calls /api/chat/append then /api/chat/mark-read for quick verification

Usage (PowerShell):

# From repository root
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/append_and_mark.ps1

Notes:
- These scripts call the demo auth endpoint to get a token.
- They assume the server is running on http://localhost:4000
- They write output to the console and print server/mockdb.json to verify persistence
