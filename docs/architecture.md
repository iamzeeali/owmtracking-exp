# Architecture — OWM Inventory / Tracking

This document explains **how the whole app is built and how the pieces talk to each other**.

Think of it like a **restaurant**:

| Real world | In this app |
|------------|-------------|
| Dining room (what customers see) | **React** website in your browser |
| Kitchen (cooks the food) | **Express API** (Node.js server) |
| Pantry (stores ingredients) | **MongoDB** database |
| Host at the door (directs guests) | **nginx** (production setup only) |

---

## 1. Big picture — what does this app do?

OWM Inventory / Tracking helps logistics teams:

- Log in securely
- Upload and view **ASN** (Advanced Shipping Notice) data
- Upload and view **GRN** (Goods Received Note) data
- **Track** shipment status
- View **reports** and submit **feedback**

All of that data is saved in **MongoDB** and shown in a **React** web app.

```
  +-------------+      +----------------+      +------------------+      +-----------+
  |    User     | ---> |   Web App      | ---> |   API Server     | ---> |  MongoDB  |
  |  (browser)  |      |   (React)      |      |   (Express)      |      |           |
  +-------------+      +----------------+      +------------------+      +-----------+
                              |                        |
                         what you see            reads / writes data
                         clicks buttons          handles /api/... routes
```

**Flow:** User opens React in the browser → React sends HTTP requests to the API → API saves and loads data from MongoDB.

---

## 2. The three main layers

Every full-stack web app has these layers. OWM has all three.

### Layer 1 — Frontend (what you see)

- **Technology:** React (in the `client/` folder)
- **Job:** Buttons, forms, tables, login page, tracking screens
- **Runs in:** The user's **web browser** (Chrome, Safari, etc.)

The frontend **does not** store the database. It asks the backend for data.

### Layer 2 — Backend / API (the brain)

- **Technology:** Node.js + Express (files like `server.js`, `app.js`, `routes/`, `controllers/`)
- **Job:**
  - Check passwords and issue login tokens (JWT)
  - Save and load ASN, GRN, tracking, reports
  - Accept Excel file uploads
- **Runs on:** A **server** (your Mac in dev, or a Docker container in production)

### Layer 3 — Database (the memory)

- **Technology:** MongoDB
- **Job:** Permanently store users, ASNs, GRNs, and everything else
- **Runs on:** MongoDB process (local install or Docker container)

```
  YOUR BROWSER                         BACKEND SERVER                    DATABASE
  +------------------+                 +---------------------------+     +----------------+
  | React UI         |  HTTP calls   | Routes                    |     | MongoDB        |
  | (client/src/)    | ------------> |   /api/user, /api/asn ... |     | owmInventory   |
  +------------------+               |        |                  |     +----------------+
                                     |        v                  |            ^
                                     | Controllers (logic)       |            |
                                     |        |                  |            |
                                     |        v                  |            |
                                     | Models (data shapes)      | ----------+
                                     +---------------------------+
```

---

## 3. How a login request travels (step by step)

When you type email + password and click **Login**:

```
  Browser (React)          API (Express)           MongoDB
       |                        |                      |
       |  POST /api/user/login  |                      |
       | ---------------------> |                      |
       |                        |  find user by email  |
       |                        | -------------------> |
       |                        |  user record         |
       |                        | <------------------- |
       |                        |  check password      |
       |  JWT token             |                      |
       | <--------------------- |                      |
       |  save token in         |                      |
       |  localStorage          |                      |
       |                        |                      |
       |  (next requests send token in header)         |
       | ---------------------> |                      |
```

**JWT** = JSON Web Token. Think of it as a **wristband** after you enter a concert — the API checks it instead of asking for your password every time.

---

## 4. Main features and API paths

| Feature | Frontend page | API path (examples) |
|---------|---------------|---------------------|
| Login | `/login` | `POST /api/user/login` |
| ASNs | `/asns` | `GET /api/asn` |
| GRNs | `/grns` | `GET /api/grn` |
| Upload Excel | `/upload` | `POST /api/asn`, `POST /api/grn` |
| Tracking | `/trackStatus/:id` | `GET /api/tracking/:id` |
| Reports | `/reports` | `GET /api/reports` |
| Feedback | `/feedback` | `GET /api/feedback` |

**Tracking logic** lives in `services/trackingStatusService.js` — it reads ASN and GRN data and calculates status.

---

## 5. Project folder map (simplified)

```
tracking project/
|
+-- client/                 FRONTEND (React)
|   +-- src/
|       +-- components/     Pages and UI pieces
|       +-- _actions/       Calls to the API
|
+-- server.js               Starts the backend
+-- app.js                  Express setup and routes
+-- routes/                 URL paths to controllers
+-- controllers/            Handle each request
+-- models/                 Database shapes (User, ASN, GRN)
+-- services/               Complex rules (e.g. tracking)
+-- utils/                  Helpers (errors, email)
|
+-- Dockerfile              Build API Docker image
+-- docker-compose.yml      Run API + Mongo (dev/local)
+-- docker-compose.prod.yml Adds nginx (production-style)
+-- nginx/nginx.conf        nginx routing rules
```

---

## 6. Two ways to run the app during development

### Mode A — Hot reload dev (best for coding)

Command: `npm run dev`

```
  Developer --> React (port 3000) --> Express (port 5001) --> MongoDB
                      |
                 proxy /api to 5001
```

- React runs on **port 3000** with live reload when you edit code.
- API runs on **port 5001**.
- Config: `config.env`

### Mode B — Docker Compose (best for "works like production")

Command: `docker compose up --build`

```
  User --> api container (port 5001) --> mongo container (internal port 27017)
```

- React is **built once** and served **inside** the API container (no port 3000).
- Config: `config.docker.env` + `docker-compose.yml`
- Data survives restarts in **Docker volumes** (`owm-mongo-data`, `owm-uploads`)

---

## 7. Production-style setup (with nginx)

When you have the prod compose file:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

**nginx** sits in front — like a **reception desk** that sends visitors to the right place.

```
  User --> nginx (port 80) --> api (internal) --> mongo (internal)
              |
         front door
    only this faces the public
```

| Piece | Public port? | Role |
|-------|--------------|------|
| **nginx** | Yes — **80** (later **443** for HTTPS) | Front door; forwards all traffic to API |
| **api** | Ideally **no** (internal only) | Runs Node + serves built React app |
| **mongo** | Ideally **no** | Stores all data |

On a real server, only nginx faces the internet. The API and database stay on a private Docker network.

---

## 8. Docker containers — what's inside each box?

```
  YOUR COMPUTER OR VPS
  +------------------------------------------------------------------+
  |  Container: owm-nginx          Container: owm-api                |
  |  +------------------+          +------------------------------+  |
  |  | nginx (alpine)   | -------> | Node.js 20                   |  |
  |  | nginx/nginx.conf |  proxy   | Express server               |  |
  |  +------------------+          | React build (client/build/)  |  |
  |                                +--------------+---------------+  |
  |                                               |                  |
  |                                               v                  |
  |                                Container: owm-mongo              |
  |                                +------------------+              |
  |                                | mongo:7          |              |
  |                                +------------------+              |
  +------------------------------------------------------------------+
```

### How the API image is built (`Dockerfile`)

Two steps (multi-stage build):

```
  STAGE 1 (client-builder)              STAGE 2 (production)
  +---------------------+               +---------------------------+
  | npm ci in client/   |               | npm ci (server deps only) |
  | npm run build       | ------------> | copy server code          |
  +---------------------+               | copy client/build output  |
                                        +---------------------------+
                                                    |
                                                    v
                                          Docker image: owm-api:local
```

Stage 1 tools (big React build) stay **out** of the final image — keeps it smaller and faster.

---

## 9. Where data is stored

| Data | Location | Survives container restart? |
|------|----------|----------------------------|
| Users, ASNs, GRNs, etc. | MongoDB volume `owm-mongo-data` | Yes |
| Uploaded Excel files | Volume `owm-uploads` at `/app/routes/uploads` | Yes |
| Login token | Browser `localStorage` | Until user logs out / clears browser |
| Secrets (JWT secret, etc.) | `config.env` / `config.docker.env` | Files on disk (not in Git) |

---

## 10. Security basics (simple view)

```
  Incoming request
        |
        v
  +-----------+     +------------+     +------------+     +------------+
  |  helmet   | --> | rate limit | --> | JWT check  | --> | controller |
  |  headers  |     | per IP     |     | (protect)  |     | (handler)  |
  +-----------+     +------------+     +------------+     +------------+
                                            |
                                   bad/missing token
                                            |
                                            v
                                    401 Unauthorized
```

- Passwords are **hashed** (not stored as plain text) — see `models/userModel.js`
- Protected routes use `authController.protect` in `routes/`
- Secrets live in env files, **not** in the Docker image (see `.dockerignore`)

---

## 11. Everything together (production)

```
                    INTERNET / USER
                           |
                           v
              +------------------------+
              |   nginx  (:80 / :443)  |  <- Front door (prod)
              +-----------+------------+
                          | proxy
                          v
              +------------------------+
              |   api  (Express)       |
              |   /api/*  -> JSON      |
              |   /*      -> React     |
              |   uploads -> disk      |
              +-----------+------------+
                          |
                          v
              +------------------------+
              |   mongo  (MongoDB)     |
              |   database: owmInventory|
              +------------------------+

        Volumes (persistent storage):
        * owm-mongo-data  -> database files
        * owm-uploads     -> Excel uploads
```

---

## 12. What this is NOT

| Term | Does OWM use it? |
|------|------------------|
| **Microservices** | No — one API handles everything (a **monolith**) |
| **Kubernetes** | No — Docker Compose is enough for this scale |
| **Separate frontend server in prod** | No — React build is served by Express |

That is normal and appropriate for apps of this size.

---

## 13. Related docs

- [docker.md](../docker.md) — How to run Docker locally
- [docker-revision-guide.md](docker-revision-guide.md) — Docker cheat sheet for future projects
- [tracking-rules.md](tracking-rules.md) — Business rules for tracking status

---

*Written for OWM Inventory / Tracking — keep this updated when you add nginx HTTPS, healthchecks, or deploy to a cloud server.*
