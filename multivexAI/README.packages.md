# MultiVexAI — Package & Dependency Reference

> Node.js microservices architecture. All versions below are taken from each service's
> `package.json` and the workspace `package-lock.json` (exact installed versions where available).

## Architecture Overview

```
                          ┌─────────────────────┐
                          │  frontend (Vite/React)  :5173
                          └──────────┬──────────┘
                                     │ HTTP (axios, credentials: include)
                          ┌──────────▼──────────┐
                          │  gateway (Express 5)   :8000
                          │  reverse proxy + auth   │
                          └──┬───────┬───────┬────┘
             /api/auth ──────┘       │       └────── /api/billing
                        ┌────────────▼───┐   ┌──────────────┐
                        │ auth        :8001│   │ billing :8004│
                        └───┬──────┬──────┘   └──────┬───────┘
                            │      │                 │
                     MongoDB│    Redis:6379     MongoDB│ + Razorpay API
                        ┌───▼──────────────┐        │
                        │ agents       :8003│◄──────┘ (credit checks)
                        │ chat_service :8002│
                        └───┬──────────────┘
                            │
        LangChain/LangGraph · Qdrant · Groq · OpenRouter · Gemini · Tavily · S3
```

The `backend/` directory is an **npm workspaces monorepo** — the root `package.json` declares
`gateway`, `services/auth`, `services/chat_service`, `services/agents`, and `services/billing`
as workspaces, plus a `shared/` package (shared Redis client).

> **Note:** `backend/auth_service/` is a legacy stub (a single health-check route, not in the
> workspaces list). The real auth service is `backend/services/auth/`.

---

## 1. Dependency Matrix

Legend: ✅ = declared dependency · (version) = exact installed version from the lock file

| Package | Frontend | Gateway | Auth | Agents | Chat | Billing |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **express** | — | ✅ 5.2.1 | ✅ 5.2.1 | ✅ 5.2.1 | ✅ 5.2.1 | ✅ 5.2.1 |
| **ioredis** (Redis) | — | ✅ 6.0.0 | ✅ 6.0.0 | — | — | — |
| **mongoose** (MongoDB) | — | — | ✅ 9.9.3 | ✅ 9.9.3 | ⚠️ 7.8.12 | ✅ 9.9.4 |
| **firebase-admin** | — | — | ✅ 14.3.0 | — | — | — |
| **firebase** (client SDK) | ✅ 12.18.0 | — | — | — | — | — |
| **razorpay** | — | — | — | — | — | ✅ ^2.9.8 *(not yet installed — see §5)* |
| **@aws-sdk/client-s3** | — | — | — | ✅ 3.1123.0 | — | — |
| **@aws-sdk/s3-request-presigner** | — | — | — | ✅ 3.1123.0 | — | — |
| **@langchain/core** | — | — | — | ✅ 1.2.9 | — | — |
| **@langchain/langgraph** | — | — | — | ✅ 1.4.12 | — | — |
| **@langchain/community** | — | — | — | ✅ 1.1.29 | — | — |
| **@langchain/openai** | — | — | — | ✅ 1.5.10 | — | — |
| **@langchain/openrouter** (OpenRouter) | — | — | — | ✅ 0.4.10 | — | — |
| **@langchain/groq** (Groq) | — | — | — | ✅ 1.3.1 | — | — |
| **@langchain/google-genai** (Gemini) | — | — | — | ✅ 2.3.0 | — | — |
| **@langchain/qdrant** (Qdrant) | — | — | — | ✅ 1.0.3 | — | — |
| **@langchain/tavily** (Tavily) | — | — | — | ✅ 1.2.0 | — | — |
| **@langchain/textsplitters** | — | — | — | ✅ 1.0.1 | — | — |
| **@google/generative-ai** (Gemini direct) | — | — | — | ✅ 0.24.1 | — | — |
| **axios** | ✅ 1.19.0 | — | — | ✅ 1.19.0 | — | ✅ ^1.20.0 |
| **dotenv** | — | ✅ 17.4.2 | ✅ 17.4.2 | ⚠️ 16.4.5 | ⚠️ 16.x | ✅ 17.4.2 |
| **express-http-proxy** | — | ✅ 2.1.2 | — | — | — | — |
| **cookie-parser** | — | ✅ 1.4.7 | — | — | — | — |
| **cors** | — | ✅ 2.8.6 | — | — | — | — |
| **morgan** | — | ✅ 1.11.0 | — | — | — | — |
| **multer** (file uploads) | — | — | — | ✅ 2.3.0 | — | — |
| **pdf-parse** | — | — | — | ✅ 2.4.5 | — | — |
| **pdfkit** | — | — | — | ✅ 0.20.2 | — | — |
| **pptxgenjs** | — | — | — | ✅ 4.0.1 | — | — |
| **nodemon** *(dev tool, currently in `dependencies`)* | — | ✅ 3.1.14 | ✅ 3.1.14 | ✅ 3.1.14 | ✅ 3.1.14 | ✅ 3.1.14 |

⚠️ = version drift across services (see §5).

---

## 2. Key Packages — Purpose & Details

### 2.1 AWS SDK (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **Purpose:** S3 object storage for user uploads (PDFs, images, documents handled by the
  agents service) and pre-signed URLs so the frontend can upload/download directly without
  proxying file bytes through the service.
- **Used by:** `agents` (see `services/agents/config/s3.js`)
- **Install (workspace-scoped):**
  ```bash
  npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner -w services/agents
  ```
- **Notes:** Both packages must stay on the **same version** (`3.1123.0`) — the presigner
  shares internal types with the client and version skew causes subtle signature failures.
  The v3 SDK is modular: only the clients you import are loaded (unlike v2).

### 2.2 Razorpay (`razorpay`)
- **Purpose:** Payment gateway — plan purchases and credit top-ups in the billing service.
  Verify webhook signatures with `razorpay.webhooks.constructEvent` for the
  `/update-plan` flow on the auth service.
- **Used by:** `billing`
- **Install:**
  ```bash
  npm install razorpay -w services/billing
  ```
- **Notes:** Declared as `^2.9.8` in `billing/package.json` but **absent from
  `package-lock.json`** — the lock file predates the dependency. Run
  `npm install` at the repo backend root to sync the lock before deploying.

### 2.3 Redis (`ioredis`)
- **Purpose:** Session store. Login writes a `session-<uuid>` blob (user profile, plan,
  credits) with a 7-day TTL; the gateway's auth middleware reads it on every protected
  route. Also declared at the backend root and in `shared/` for the shared client in
  `backend/shared/redis/redis.js`.
- **Used by:** backend root, `shared`, `gateway`, `auth` (4 places — keep versions aligned)
- **Install:**
  ```bash
  npm install ioredis -w gateway -w services/auth
  ```
- **Notes:** ioredis 6.x is the current line. All declarations already use `^6.0.0`, which
  is correct. Server-side: `redis:7-alpine` in `docker-compose.yml` (port 6379).

### 2.4 MongoDB (`mongoose`)
- **Purpose:** Primary document store for users, chats, agent runs, and billing records.
- **Used by:** `auth`, `agents`, `chat_service`, `billing`
- **Install:**
  ```bash
  npm install mongoose -w services/auth -w services/agents -w services/chat_service -w services/billing
  ```
- **Notes:** ⚠️ **Version drift — see §5.** `chat_service` is on mongoose **7.8.12**
  (declared `^7.0.0`) while every other service is on **9.9.x**. Upgrade chat_service to
  `^9.9.3` to match; v7 vs v9 have different middleware/typing behavior and duplicate
  driver versions bloat the install.

### 2.5 LangChain / LangGraph (`@langchain/*`)
- **Purpose:** The AI orchestration layer of the agents service:
  - `@langchain/langgraph` — agent graphs and routing (`services/agents/graph/`)
  - `@langchain/core` — base abstractions (messages, runnables) required by all others
  - `@langchain/community` — community integrations
  - `@langchain/textsplitters` — document chunking for RAG ingestion
  - Provider integrations: `openai`, `openrouter`, `groq`, `google-genai`, `tavily`, `qdrant`
- **Used by:** `agents`
- **Install (all at once):**
  ```bash
  npm install @langchain/core @langchain/langgraph @langchain/community \
    @langchain/textsplitters @langchain/openai @langchain/openrouter \
    @langchain/groq @langchain/google-genai @langchain/tavily @langchain/qdrant \
    -w services/agents
  ```
- **Notes:** LangChain 1.x packages must be **version-locked together** — `core` 1.2.9 is
  the peer for the 1.x integration line. Mixing 0.x and 1.x packages throws peer-dependency
  and runtime type errors. Never widen `@langchain/*` ranges independently; bump them as a set.

### 2.6 Tavily (`@langchain/tavily`)
- **Purpose:** Web search tool for the search agent (LLM-optimized search API). Configured
  in `services/agents/config/tavily.js`.
- **Used by:** `agents`
- **Install:** `npm install @langchain/tavily -w services/agents`
- **Notes:** Requires `TAVILY_API_KEY`. Consumed as a LangChain tool rather than the raw
  REST API, so it stays composable inside agent graphs.

### 2.7 OpenRouter (`@langchain/openrouter`)
- **Purpose:** Access frontier models (Claude, GPT, etc.) through a single OpenRouter API
  key — one of the selectable LLM backends in `services/agents/config/llmmodel.js`.
- **Used by:** `agents`
- **Install:** `npm install @langchain/openrouter -w services/agents`
- **Notes:** Requires `OPENROUTER_API_KEY`. Version `0.4.x` is a different major line from
  the other LangChain integrations (by design — it tracks its own release cadence). Fine as
  long as `@langchain/core` peer requirements are satisfied.

### 2.8 Qdrant (`@langchain/qdrant`)
- **Purpose:** Vector database for the multimodal RAG pipeline — stores document embeddings
  for similarity search (agent memory + document QA). See
  `services/agents/config/qdrant.vectorDB.js`.
- **Used by:** `agents`
- **Install:** `npm install @langchain/qdrant -w services/agents`
- **Notes:** Requires a running Qdrant instance (this repo also keeps a local
  `.qdrant/` store at the project root for the Python prototype). If you need raw
  collection administration (create/recalibrate/snapshot) beyond what the LangChain
  integration exposes, add `@qdrant/js-client-rest` (see §6).

### 2.9 Groq (`@langchain/groq`)
- **Purpose:** Ultra-low-latency LLM inference (Llama-family models) as a fast/cheap
  backend option in the model router.
- **Used by:** `agents`
- **Install:** `npm install @langchain/groq -w services/agents`
- **Notes:** Requires `GROQ_API_KEY`. Same 1.x LangChain peer line as the others.

---

## 3. Per-Service Dependency Details

### 3.1 `backend/` (monorepo root + `shared/`)

| Package | Declared | Installed | Purpose |
|---|---|---|---|
| ioredis | ^6.0.0 | 6.0.0 | Shared Redis client (`shared/redis/redis.js`) |

```bash
npm install          # installs ALL workspaces + shared (from backend/)
```

### 3.2 `gateway/` — API gateway & reverse proxy (:8000)

| Package | Declared | Installed | Purpose |
|---|---|---|---|
| express | ^5.2.1 | 5.2.1 | HTTP framework |
| express-http-proxy | ^2.1.2 | 2.1.2 | Proxies /api/auth, /api/chat, /api/agent, /api/billing to downstream services |
| cookie-parser | ^1.4.7 | 1.4.7 | Parses the `session` cookie for auth middleware |
| cors | ^2.8.6 | 2.8.6 | CORS with credentials for the frontend origin |
| morgan | ^1.11.0 | 1.11.0 | HTTP request logging |
| ioredis | ^6.0.0 | 6.0.0 | Reads session blobs in `middleware/auth.middleware.js` |
| dotenv | ^17.4.2 | 17.4.2 | Env config (`gateway/.env`) |
| nodemon | ^3.1.14 | 3.1.14 | Dev auto-restart |

```bash
npm install express express-http-proxy cookie-parser cors morgan ioredis dotenv -w gateway
npm install -D nodemon -w gateway        # note: currently in dependencies (see §5)
```

### 3.3 `services/auth/` — authentication (:8001)

| Package | Declared | Installed | Purpose |
|---|---|---|---|
| express | ^5.2.1 | 5.2.1 | HTTP framework |
| firebase-admin | ^14.3.0 | 14.3.0 | Verifies Google ID tokens from the frontend; loads `serviceAccountKey.json` |
| mongoose | ^9.9.3 | 9.9.3 | User profile documents |
| ioredis | ^6.0.0 | 6.0.0 | Session storage (7-day TTL) |
| dotenv | ^17.4.2 | 17.4.2 | Env config |
| nodemon | ^3.1.14 | 3.1.14 | Dev auto-restart |

```bash
npm install express firebase-admin mongoose ioredis dotenv -w services/auth
```

### 3.4 `services/agents/` — AI agents & RAG (:8003)

| Package | Declared | Installed | Purpose |
|---|---|---|---|
| express | ^5.2.1 | 5.2.1 | HTTP framework |
| @langchain/langgraph | ^1.4.12 | 1.4.12 | Agent graph orchestration |
| @langchain/core | ^1.2.9 | 1.2.9 | LangChain base |
| @langchain/community | ^1.1.29 | 1.1.29 | Community integrations |
| @langchain/openai | ^1.5.10 | 1.5.10 | OpenAI provider |
| @langchain/openrouter | ^0.4.10 | 0.4.10 | OpenRouter provider |
| @langchain/groq | ^1.3.1 | 1.3.1 | Groq provider |
| @langchain/google-genai | ^2.3.0 | 2.3.0 | Gemini provider |
| @google/generative-ai | ^0.24.1 | 0.24.1 | Direct Gemini SDK (image/vision calls) |
| @langchain/tavily | ^1.2.0 | 1.2.0 | Web search tool |
| @langchain/qdrant | ^1.0.3 | 1.0.3 | Qdrant vector store |
| @langchain/textsplitters | ^1.0.1 | 1.0.1 | Document chunking |
| @aws-sdk/client-s3 | ^3.1123.0 | 3.1123.0 | S3 uploads |
| @aws-sdk/s3-request-presigner | ^3.1123.0 | 3.1123.0 | Pre-signed URLs |
| mongoose | ^9.9.3 | 9.9.3 | Agent/chat persistence |
| multer | ^2.3.0 | 2.3.0 | Multipart file uploads |
| pdf-parse | ^2.4.5 | 2.4.5 | PDF text extraction |
| pdfkit | ^0.20.2 | 0.20.2 | PDF report generation |
| pptxgenjs | ^4.0.1 | 4.0.1 | PowerPoint generation |
| axios | ^1.19.0 | 1.19.0 | Inter-service HTTP calls |
| dotenv | ^16.4.5 | 16.4.5 | Env config |
| nodemon | ^3.1.14 | 3.1.14 | Dev auto-restart |
| jest (dev) | ^29.7.0 | 29.7.0 | Tests |

```bash
npm install -w services/agents \
  express @langchain/langgraph @langchain/core @langchain/community \
  @langchain/openai @langchain/openrouter @langchain/groq @langchain/google-genai \
  @langchain/tavily @langchain/qdrant @langchain/textsplitters @google/generative-ai \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner mongoose multer \
  pdf-parse pdfkit pptxgenjs axios dotenv
npm install -D jest nodemon -w services/agents
```

### 3.5 `services/chat_service/` — chat (:8002)

| Package | Declared | Installed | Purpose |
|---|---|---|---|
| express | ^5.2.1 | 5.2.1 | HTTP framework |
| mongoose | ^7.0.0 | 7.8.12 | Chat persistence ⚠️ v7 — see §5 |
| dotenv | ^16.0.0 | 16.x | Env config ⚠️ v16 — see §5 |
| nodemon | ^3.1.14 | — | Dev auto-restart |

```bash
npm install express mongoose@^9.9.3 dotenv@^17.4.2 -w services/chat_service   # aligned versions
```

### 3.6 `services/billing/` — payments (:8004)

| Package | Declared | Installed | Purpose |
|---|---|---|---|
| express | ^5.2.1 | 5.2.1 | HTTP framework |
| razorpay | ^2.9.8 | *(not installed)* | Payment gateway |
| mongoose | ^9.9.4 | 9.9.4 | Payment/plan records |
| axios | ^1.20.0 | — | Calls auth service `/update-plan` |
| dotenv | ^17.4.2 | 17.4.2 | Env config |
| nodemon | ^3.1.14 | 3.1.14 | Dev auto-restart |

```bash
npm install razorpay mongoose axios express dotenv -w services/billing
```

### 3.7 `frontend/` — React SPA (:5173, Vite)

| Package | Declared | Purpose |
|---|---|---|
| react / react-dom | ^19.2.8 | UI framework |
| react-router-dom | ^7.18.2 | Routing |
| @reduxjs/toolkit / react-redux | ^2.12.0 / ^9.3.0 | State management |
| axios | ^1.19.0 | HTTP client (with `withCredentials`) |
| firebase | ^12.18.0 | Google OAuth sign-in (client SDK) |
| react-markdown / remark-gfm | ^10.1.0 / ^4.0.1 | Chat markdown rendering |
| react-syntax-highlighter | ^16.1.1 | Code blocks |
| markdown | ^0.5.0 | Markdown utilities |
| @monaco-editor/react | ^4.7.0 | In-browser code editor |
| lucide-react / react-icons | ^1.34.0 / ^5.7.0 | Icon sets |
| motion | ^13.1.1 | Animations |
| tailwindcss / @tailwindcss/vite | ^4.3.3 | Styling |
| vite | ^8.2.0 (dev) | Build tool / dev server |
| eslint + react plugins | ^10.x (dev) | Linting |

```bash
cd ../frontend
npm install
```

---

## 4. Environment Variables Required by These Packages

| Service | Variables |
|---|---|
| gateway | `PORT`, `AUTH_SERVICE`, `CHAT_SERVICE`, `AGENTS_SERVICE`, `BILLING_SERVICE`, `FRONTEND_URL`, `REDIS_URL` |
| auth | `PORT`, `MONGODB_URL`, `REDIS_URL` + `serviceAccountKey.json` (firebase-admin) |
| agents | `PORT`, `MONGODB_URL`, `REDIS_URL`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `GOOGLE_API_KEY`, `TAVILY_API_KEY`, Qdrant URL/key, AWS S3 credentials |
| chat_service | `PORT`, `MONGODB_URL` |
| billing | `PORT`, `MONGODB_URL`, `AUTH_SERVICE`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| frontend | Firebase web config (`VITE_FIREBASE_*`) |

---

## 5. Version Considerations & Known Issues

1. **mongoose drift (major):** `chat_service` is on **7.8.12**, all others on **9.9.x**.
   Upgrade: `npm install mongoose@^9.9.3 -w services/chat_service`. Mongoose 7 is EOL-tier;
   v9 has breaking middleware/query changes, so test after upgrading.
2. **dotenv drift (major):** `agents` (`^16.4.5`) and `chat_service` (`^16.0.0`) vs 17.4.2
   elsewhere. Low functional impact (both load `.env` files), but align to `^17.4.2` for
   consistency and a single hoisted copy.
3. **razorpay not in lock file:** declared in `billing/package.json` but absent from
   `package-lock.json`. Run `npm install` at `backend/` and commit the refreshed lock.
4. **nodemon in `dependencies`:** every backend service lists nodemon as a *production*
   dependency. Move it to `devDependencies` (`npm install -D nodemon -w <workspace>`) to
   slim Docker images built with `npm ci --omit=dev`.
5. **LangChain set must move together:** keep all `@langchain/*` on their current paired
   1.x line; do not upgrade one integration ahead of `core`.
6. **express 5:** all services are on Express 5 — note that route handlers with async
   errors now forward to error middleware automatically, but many older middleware
   tutorials assume Express 4 behavior.
7. **jest without test setup:** `backend` root and `auth` declare `"test": "jest"` but
   neither lists jest as a devDependency (only `agents` does). Add jest where the script
   exists, or remove the script.

---

## 6. Suggested Missing Packages

These are standard for this architecture but currently absent. Reasoning included.

### Backend — all services
| Package | Why |
|---|---|
| `helmet` | Security headers on the gateway — first line of defense for an internet-facing proxy. `npm i helmet -w gateway` |
| `express-rate-limit` | Brute-force protection for `/api/auth/login` and billing endpoints. |
| `zod` | Request-body validation (login token, plan/credit payloads) — catches malformed input as 400s instead of 500s. |
| `pino` + `pino-http` | Structured JSON logging. Only `morgan` (gateway, request-line only) and bare `console.log` exist today; services are unobservable in prod. |
| `compression` | Gzip/brotli at the gateway for large AI responses. |
| `jsonwebtoken` or shared session util | Session validation logic is hand-rolled and duplicated between gateway and auth; extract into `shared/` (no new package strictly required if Redis stays the source of truth). |

### Testing (currently only jest in agents, zero tests elsewhere)
| Package | Why |
|---|---|
| `supertest` | HTTP-level tests for each Express service. |
| `mongodb-memory-server` | Integration tests against mongoose without a live Atlas cluster. |
| `vitest` + `@testing-library/react` | Frontend has eslint but no test runner or component tests. |
| `testcontainers` (optional) | Spin up Redis/Mongo/Qdrant in Docker for true integration tests. |

### Tooling / DX
| Package | Why |
|---|---|
| `eslint` + `@eslint/js` (backend) | Frontend has ESLint 10 configured; **backend has none**. Same flat-config pattern can be reused per workspace. |
| `husky` + `lint-staged` | Enforce lint + tests on commit — the "prevent defects before they land" layer. |
| `tsx` (optional) | If migrating to TypeScript (`tsx` runs TS directly in nodemon-style dev); the Python half of this repo already shows the RAG logic worth typing. |
| `@qdrant/js-client-rest` (optional) | Raw Qdrant admin ops (collection create/snapshot) beyond `@langchain/qdrant`'s API. |
| `winston` (alternative to pino) | If the team prefers a more traditional logger; pick exactly one. |
| `http-errors` | Consistent error objects (`createError(404)`) instead of ad-hoc `res.status(...).json({message})` strings. |

---

## 7. Installation Quick Start

### Full backend (workspaces handle everything)

```bash
cd multivexAI/backend
npm install                       # installs gateway + all services + shared
npm run dev                       # start all services (nodemon)
# or individually:
npm run dev:gateway
npm run dev:auth
npm run dev:chat
npm run dev:agents
```

### Frontend

```bash
cd multivexAI/frontend
npm install
npm run dev                       # Vite on :5173
```

### Infrastructure via Docker Compose (Redis + all services)

```bash
cd multivexAI/backend
docker compose up -d --build      # full stack (containers resolve each other by hostname)
docker compose up -d redis        # just Redis, services running locally on host
```

> When running services **locally**, each service's `.env` must point at
> `http://localhost:<port>` / `redis://localhost:6379`. When running **in compose**, the
> `environment:` overrides in `docker-compose.yml` point services at container hostnames
> (`http://auth:8001` etc.) — the `.env` localhost values are ignored.

### Adding a new package to one service

```bash
# from backend/ root (workspace-scoped — updates only that service's package.json)
npm install <package> -w services/agents

# dev-only
npm install -D <package> -w services/agents
```

---

*Generated from `package.json` / `package-lock.json` manifests as of 2026-09-08. Re-run a
version audit after any `npm update` — the matrix in §1 is the source of truth for who
uses what.*
