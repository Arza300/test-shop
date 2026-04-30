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
