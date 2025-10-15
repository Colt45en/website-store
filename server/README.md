Nova Server

Quick start:

1. cd server
2. npm install
3. npm start

API endpoints:
- POST /api/auth/login  { email, password } -> { token, user }
- GET /api/auth/me (Authorization: Bearer <token>) -> user
- GET /api/products -> products

This is a demo server with in-memory data. For production, replace with a database and secure password hashing.
