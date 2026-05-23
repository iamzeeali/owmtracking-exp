# =========================
# Stage 1 — client-builder
# =========================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy package files first for Docker cache efficiency
COPY client/package.json client/package-lock.json ./

RUN npm ci

# Copy remaining client files
COPY client/ ./

# Compatibility workaround if React/Webpack build hits OpenSSL issues
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm run build


# =====================
# Stage 2 — production
# =====================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy root dependency files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy server files and folders
COPY server.js ./
COPY app.js ./

COPY controllers ./controllers
COPY models ./models
COPY routes ./routes
COPY services ./services
COPY utils ./utils

# Add any other backend folders your app uses
# COPY middleware ./middleware
# COPY config ./config

# Copy built frontend from stage 1
COPY --from=client-builder /app/client/build ./client/build

EXPOSE 5001

CMD ["node", "server.js"]