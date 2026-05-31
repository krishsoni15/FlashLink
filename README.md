# ⚡ FlashLink

[![Go Version](https://img.shields.io/badge/Go-1.22-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

An institutional-grade, developer-first Link Management & Link-in-Bio SaaS built for **extreme speed**. Features a Redis-first hot path for sub-millisecond redirects and asynchronous stream buffering for click tracking.

---

## ⚡ Performance

- **Sub-Millisecond Latency:** Redirect paths average `< 1ms` using direct in-memory cache lookups.
- **Zero-DB Read Path:** PostgreSQL is never queried on the hot redirect path.
- **Async Event Sync:** Clicks are queued via Redis Streams and written to PostgreSQL in background worker batches to maximize throughput.

```mermaid
graph LR
    User([Request]) --> Edge[Go Redirect Handler]
    Edge -- Cache Lookups --> Redis[(Redis Cache)]
    Edge -- Async Stream Logs --> Stream[Redis Stream]
    Stream --> Worker[Worker Threads] --> PG[(Postgres DB)]
```

---

## 💻 Local Quickstart

Start the entire stack (PostgreSQL, Redis, Go API, and Next.js frontend) with a single command:

```bash
docker compose up -d --build
```

- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API:** `http://localhost:8080`

---

## 🔐 Unified Authentication & Developer API

Protected endpoints accept both **JWT tokens** (for dashboard client requests) and **Developer API Keys** prefixed with `fl_live_` (hashed securely via SHA-256).

### Create a Short Link (cURL)
```bash
curl -X POST http://localhost:8080/api/v1/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fl_live_your_key_here" \
  -d '{"url": "https://github.com", "custom_alias": "hub"}'
```

**Response (`201 Created`):**
```json
{
  "id": "785429ac-bc71-4890-a29d-4876b5efc1c9",
  "short_code": "hub",
  "original_url": "https://github.com",
  "short_url": "http://localhost:8080/hub",
  "click_count": 0,
  "created_at": "2026-05-31T16:20:00Z"
}
```

---

## ☁️ 1-Click Production Hosting

You can deploy the entire stack in one place:

1. **Next.js Frontend & Go Backend (Vercel Monorepo):** 
   - Deploy directly using the pre-configured `vercel.json` in the repository root.
2. **PostgreSQL & Redis Cache:**
   - Link managed databases from [Neon](https://neon.tech/) (Postgres) and [Upstash](https://upstash.com/) (Serverless Redis).
3. **Alternative (Self-Hosted VPS):**
   - Run `docker compose up -d` on any free virtual machine (e.g., Oracle Cloud Free Tier).
