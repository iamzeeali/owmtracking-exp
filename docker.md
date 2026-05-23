# Docker setup — OWM Inventory / Tracking

Run the API and MongoDB with Docker Compose. The API image builds the React client and serves it in production mode on port **5001**.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Verify CLI:

```bash
docker --version
docker compose version
```

## Architecture (Compose)

| Service | Image / build | Host port | Notes |
|---------|---------------|-----------|--------|
| `mongo` | `mongo:7` | **27018** → 27017 | Data in volume `owm-mongo-data` |
| `api` | `Dockerfile` → `owm-api:local` | **5001** | Uploads in volume `owm-uploads` |

Services talk on an internal Docker network. The API uses hostname **`mongo`** (not `localhost`).

```
Browser → localhost:5001 → api container → mongo:27017
Compass   → localhost:27018 → mongo container
```

## First-time setup

From the **project root** (folder containing `docker-compose.yml`):

### 1. Environment files

```bash
cp config.env.example config.env
cp config.env.example config.docker.env
```

Edit `config.docker.env` for Docker. Required format for `--env-file` / Compose:

```env
NODE_ENV=production
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
PORT=5001
```

Rules:

- `KEY=value` only
- **No** spaces around `=`
- **No** quotes around values

`DATABASE` for the API in Compose is set in `docker-compose.yml`:

```yaml
environment:
  DATABASE: mongodb://mongo:27017/owmInventory
```

That override applies when using Compose. Do not use `host.docker.internal` for the API service inside Compose.

| File | Used for |
|------|----------|
| `config.env` | `npm run server`, `npm run dev` on your Mac |
| `config.docker.env` | `docker compose`, `docker run --env-file` |

Both are gitignored. Never commit real secrets.

### 2. Stop conflicting manual containers (if any)

```bash
docker stop owm-api owm-mongo 2>/dev/null; true
docker rm owm-api owm-mongo 2>/dev/null; true
```

If native Mongo uses port 27017, that is fine — Compose publishes Docker Mongo on **27018**.

### 3. Validate Compose file

```bash
docker compose config
```

### 4. Start the stack

Foreground (see logs):

```bash
docker compose up --build
```

Background:

```bash
docker compose up --build -d
docker compose logs -f api
```

**Success (api logs):**

- `MongoDB Connected`
- `Server running on port 5001`

## App URL

- **Application:** http://localhost:5001
- **Login:** http://localhost:5001/login

## Create the first user

Docker Mongo uses a separate data volume from native Mongo on port 27017. The database may be **empty** on first run.

There is no signup page in the React UI. Create an admin via API:

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

`password` and `passwordConfirm` must match.

Test login:

```bash
curl -X POST http://localhost:5001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

Check users in Mongo:

```bash
docker compose exec mongo mongosh owmInventory --eval "db.users.countDocuments()"
docker compose exec mongo mongosh owmInventory --eval "db.users.find({}, {email:1, name:1, role:1}).pretty()"
```

## Daily commands

| Task | Command |
|------|---------|
| Start (build if needed) | `docker compose up --build -d` |
| View API logs | `docker compose logs -f api` |
| List services | `docker compose ps` |
| Stop | `docker compose stop` |
| Stop + remove containers | `docker compose down` |
| Stop + **delete DB & uploads** | `docker compose down -v` |
| Rebuild after code change | `docker compose up --build -d` |
| Validate YAML | `docker compose config` |

## Volumes

| Volume | Mount | Purpose |
|--------|-------|---------|
| `owm-mongo-data` | `/data/db` in mongo | Database persistence |
| `owm-uploads` | `/app/routes/uploads` in api | GRN/ASN Excel uploads |

Uploads are stored under `routes/uploads/` in the codebase. Without the uploads volume, files are lost when the API container is recreated.

## Build image only (without Compose)

```bash
docker build -t owm-api:local .
```

Run API alone (Mongo must be reachable; Compose is preferred):

```bash
docker run --rm \
  -p 5001:5001 \
  --env-file config.docker.env \
  -e DATABASE=mongodb://host.docker.internal:27018/owmInventory \
  --name owm-api \
  owm-api:local
```

Use `host.docker.internal` only when the API container talks to Mongo published on the **host** (e.g. port 27018), not when both run in Compose.

## Local dev without Docker

```bash
cp config.env.example config.env
# Set DATABASE to match your Mongo (27017 native or 27018 Docker)

npm run dev
```

- React: http://localhost:3000 (proxies `/api` to port 5001)
- API: http://localhost:5001

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `invalid env file` / `NODE_ENV ` whitespace | `config.docker.env`: strict `KEY=value` |
| `unexpected type map[string]interface {}` | In compose, use `environment: DATABASE: url` (map) or `- DATABASE=url` (list), not `- DATABASE: url` |
| `env_file` not found | Filename must be `config.docker.env` |
| Port 5001 in use | `lsof -i :5001` — stop other Node/Docker processes |
| Port 27018 in use | Stop old `owm-mongo` or change host port in compose |
| API cannot connect to Mongo | In Compose, `DATABASE=mongodb://mongo:27017/owmInventory` |
| Login fails | Empty DB — run signup `curl` above |
| Data missing vs old setup | Native Mongo (27017) ≠ Docker volume (27018) — separate databases |
| Uploads gone after rebuild | Ensure `owm-uploads` volume is in `docker-compose.yml` |

## What the Dockerfile does

1. **Stage 1 (`client-builder`):** `npm ci` + `npm run build` in `client/`
2. **Stage 2 (`production`):** `npm ci --omit=dev`, copy server code, copy `client/build`, run `node server.js`

`NODE_ENV=production` makes Express serve the React build from `client/build`.

## Production checklist (later)

- Strong `JWT_SECRET` from secrets manager / CI
- MongoDB authentication
- Container healthchecks and `depends_on: condition: service_healthy`
- Non-root user in Dockerfile
- HTTPS reverse proxy (Nginx, Traefik, cloud load balancer)
- Push images to a registry (ECR, GCR, Docker Hub) with version tags
- CI: `docker build` + tests on every PR

## Related files

- `Dockerfile` — multi-stage API + React build
- `docker-compose.yml` — mongo + api services
- `.dockerignore` — excludes `node_modules`, `config.env`, etc.
- `config.env.example` — env template
