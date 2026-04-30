# NebulaPlay — Gaming Store

Next.js 14 (App Router) e‑commerce demo: games, gift cards, and accessories, with Prisma + PostgreSQL (Neon), NextAuth (JWT), Zustand cart, React Query, Zod, Tailwind, and shadcn/ui. Optional image hosting on Cloudflare R2 (S3 API).

## Prerequisites

- Node 18+
- A [Neon](https://neon.tech) (or any) PostgreSQL `DATABASE_URL`

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL`, `NEXTAUTH_SECRET` (32+ random bytes), and `NEXTAUTH_URL` (e.g. `http://localhost:3000`).

2. Install and migrate:

   ```bash
   npm install
   npx prisma migrate dev --name init
   npm run db:seed
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).  
   **Seed logins (after `db:seed`):** `admin@example.com` / `Password123!` and `user@example.com` / `Password123!`

## Deploying on Vercel (NextAuth)

Vercel does **not** read your local `.env` file. Missing auth env in Production causes **`/api/auth/error?error=Configuration`**.

In **Project → Settings → Environment Variables**, set at least:

| Variable | Production value |
|---------|-------------------|
| `NEXTAUTH_SECRET` | Strong secret (for example generate with `openssl rand -base64 32`). You can alternatively set `AUTH_SECRET` to the same value. |
| `NEXTAUTH_URL` | Canonical site URL with HTTPS, for example `https://your-deployment.vercel.app` (match your domain exactly, no stray trailing slash unless your host uses one). |
| `DATABASE_URL` | Same Postgres connection string you use for Neon (or your provider), with TLS if required. |
| `DIRECT_URL` | Neon-style direct URL; same as local setup (see [.env.example](.env.example)). |

Attach these to **Production** (and Preview if you want previews to authenticate). Optional keys such as `R2_*` and `STRIPE_SECRET_KEY` behave as documented above.

Then **Redeploy** the latest deployment (or push a commit) so serverless functions pick up the new variables.

Sanity check: `GET /api/auth/providers` should return **200 JSON** once `NEXTAUTH_SECRET` (or `AUTH_SECRET`) is set; until then NextAuth responds with configuration errors.

### Application error white page (“Digest”) on Vercel

`NEXTAUTH_URL` fixes the **canonical URL** NextAuth uses; it **does not** prevent unrelated server crashes. Next.js hides the stack trace behind a **Digest** (for example Digest `732991`).

Do this:

1. **Runtime logs**: Vercel → your deployment → **Functions** / **Runtime Logs**. Search by the digest or by the timestamp when you reproduced the issue. Typical causes once auth env is partly set: unset `DATABASE_URL` / bad Neon URL, unset `DIRECT_URL` (Prisma still needs it when defined in the datasource), runtime Prisma errors, or crashes in a Server Component.
2. **`GET /api/health/db`**: Returns JSON `{ ok: true, … }` when Prisma connects. It also echoes **boolean-only** env flags (`env.DATABASE_URL`, `NEXTAUTH_OR_AUTH_SECRET`, etc.) — no secret values — so you can confirm what the server resolved without opening the homepage.
3. **Redeploy** after changing Environment Variables — values are injected at deployment time.

## R2 (optional)

If `R2_*` variables are set, admin “New/Edit product” can upload files via `POST /api/upload`. Otherwise use image URLs like `/placeholder.svg` or a full HTTPS URL to your R2 public domain.

## SQL reference

- [`sql/init.sql`](sql/init.sql) — DDL matching `prisma/schema.prisma` (for manual DBA use).
- [`sql/seed.sql`](sql/seed.sql) — no-op note; real seed is [`prisma/seed.ts`](prisma/seed.ts) via `npm run db:seed`.

## Scripts

| Script          | Description                |
|----------------|----------------------------|
| `npm run dev`  | Development server         |
| `npm run build`| Production build             |
| `npm run start`| Start production server    |
| `npm run db:push` | `prisma db push`        |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed`   | Run Prisma seed         |

## Stripe

Payment flow is order creation + stub in [`lib/payment/stripe.ts`](lib/payment/stripe.ts). Set `STRIPE_SECRET_KEY` when you integrate real Checkout or PaymentIntents.
