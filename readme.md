# OWM Inventory / Tracking

Inventory tracking application for OWM — Node.js/Express API with a React client and MongoDB.

## Tech stack

- **Backend:** Node.js 20+, Express, Mongoose
- **Frontend:** React (Create React App) in `client/`
- **Database:** MongoDB

## Prerequisites

- Node.js **18+** (project uses Node 20 — see `.nvmrc`)
- MongoDB (local install or via Docker — see [docker.md](docker.md))
- npm

## Quick start (local development)

### 1. Install dependencies

```bash
npm install
npm run clientinstall
```

### 2. Environment

```bash
cp config.env.example config.env
```

Edit `config.env` with your values. Example `DATABASE` options:

- Native Mongo on Mac: `mongodb://localhost:27017/owmInventory`
- Docker Mongo (host port 27018): `mongodb://localhost:27018/owmInventory`

### 3. Run

**API only:**

```bash
npm run server
```

**API + React dev server (hot reload):**

```bash
npm run dev
```

| Mode | App URL | API |
|------|---------|-----|
| `npm run dev` | http://localhost:3000 | Proxied to port **5001** |
| `npm start` / `npm run server` | — | http://localhost:5001 |

### 4. Tests

```bash
npm run test:tracking
```

## Docker (prod-like local run)

Run API + MongoDB with Docker Compose (built React app on port **5001**).

**Full guide:** [docker.md](docker.md)

**Short version:**

```bash
cp config.env.example config.env
cp config.env.example config.docker.env
# Edit config.docker.env — KEY=value only (no spaces, no quotes)

docker compose up --build
```

Open http://localhost:5001

## Project structure

```
├── app.js, server.js    # Express app entry
├── controllers/         # Route handlers
├── models/              # Mongoose models
├── routes/              # API routes (uploads → routes/uploads/)
├── services/            # Business logic
├── client/              # React frontend
├── Dockerfile           # Multi-stage production image
├── docker-compose.yml   # Mongo + API stack
└── docker.md            # Docker documentation
```

## Environment files

| File | Purpose | Committed? |
|------|---------|------------|
| `config.env.example` | Template for local/Docker env | Yes |
| `config.env` | Local dev (`npm run dev`) | No (gitignored) |
| `config.docker.env` | Docker / Compose | No (gitignored) |

**Never commit real secrets** (`JWT_SECRET`, etc.).

## API — create first user

There is no public signup page in the UI. Create a user via API:

```bash
curl -X POST http://localhost:5001/api/user/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "passwordConfirm": "password123",
    "role": "admin"
  }'
```

Then log in at http://localhost:5001/login

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start API (`node server.js`) |
| `npm run server` | API with nodemon |
| `npm run client` | React dev server |
| `npm run dev` | API + client concurrently |
| `npm run test:tracking` | Tracking service tests |

## Documentation

- [docs/architecture.md](docs/architecture.md) — System architecture (diagrams & overview)
- [docker.md](docker.md) — Docker & Compose setup
- [docs/docker-revision-guide.md](docs/docker-revision-guide.md) — Docker revision guide (reusable playbook)
- [docs/tracking-rules.md](docs/tracking-rules.md) — Tracking business rules

## License

ISC — Globus Labs
