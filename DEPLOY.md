# Deploy notes — MediSmile Admin Dashboard

Next.js 15 frontend. Talks to the remote MediSmile API.

---

## A) Classic VPS (Node + PM2 + Nginx)

### 1) Clone

```bash
git clone <REPO_URL>
cd <PROJECT_FOLDER>
```

### 2) Environment

```bash
cp .env.example .env.local
```

Confirm at least:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.medismile.xn--mgbaab0cxheq.tech/api
```

### 3) Install + build + run

```bash
npm install
npm run build
npm run start
```

App listens on port `3000`.

Recommended with PM2:

```bash
npm install -g pm2
pm2 start npm --name medismile-admin -- start
pm2 save
pm2 startup
```

### 4) Nginx + HTTPS

Proxy to `http://127.0.0.1:3000` and enable HTTPS (Certbot).

### 5) Update later

```bash
git pull
npm install
npm run build
pm2 restart medismile-admin
```

---

## B) Docker (recommended for consistent VPS deploys)

Requires Docker Engine + Docker Compose plugin.

### 1) Clone + env

```bash
git clone <REPO_URL>
cd <PROJECT_FOLDER>
cp .env.example .env
```

Edit `.env` if needed (`NEXT_PUBLIC_API_BASE_URL`, `ADMIN_HOST_PORT`).

### 2) Build & run

```bash
docker compose up -d --build
```

Health probe: `GET /health` → `{ "status": "ok", ... }`

### 3) Useful commands

```bash
docker compose ps
docker compose logs -f admin
docker compose down
```

### 4) Update later

```bash
git pull
docker compose up -d --build
```

> `NEXT_PUBLIC_*` is baked into the client bundle at **build** time.  
> After changing it, rebuild the image (`--build`).

Put Nginx in front of the published port (default `3000`) for HTTPS / domain.

---

## Important

- Do **not** use `npm run dev` on the VPS.
- Do **not** commit `.env` / `.env.local`.
- Ensure API CORS allows the frontend domain.
- Backend is external; this image only runs the admin UI.
