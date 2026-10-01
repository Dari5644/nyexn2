---
title: NYEXN2 Backend
emoji: 🎮
colorFrom: purple
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# NYEXN2 Backend
`cp .env.example .env` -> edit -> `npm install` -> `npm start`

| Variable | Where | Purpose |
|---|---|---|
| JWT_SECRET | Replit Secrets | JWT signing key (16+ chars) |
| ADMIN_PASSWORD | Replit Secrets | Admin login password |
| FRONTEND_ORIGIN | Replit Secrets | Frontend URL for CORS |
| DATA_DIR | Replit Secrets | SQLite + uploads folder |
| KICK_POLL_MS | Replit Secrets | Live status poll interval |
| VITE_API_URL | Frontend host | Backend base URL |

Kick Client ID/Secret and the Discord webhook are entered in the admin panel.
