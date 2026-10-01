# syntax=docker/dockerfile:1
# NYEXN2 backend — works on Hugging Face Spaces (Docker), Render and Railway.

FROM node:20-bookworm-slim AS deps
WORKDIR /app
# build tools only needed if better-sqlite3 has no prebuilt binary for the platform
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:20-bookworm-slim
ENV NODE_ENV=production \
    PORT=7860 \
    DATA_DIR=/app/data
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# /data is used when a persistent volume is mounted there (set DATA_DIR=/data)
RUN mkdir -p /app/data /data && chown -R node:node /app /data
USER node
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
