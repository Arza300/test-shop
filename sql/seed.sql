-- Optional raw seed (prefer `npm run db:seed` with Prisma for bcrypt hashes and stable IDs)
-- This file is an example; passwords must be hashed with bcrypt in real use.

-- INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "updatedAt")
-- VALUES (
--   'user_seed_admin_01',
--   'admin@example.com',
--   'Admin',
--   '<bcrypt hash>',
--   'ADMIN',
--   NOW()
-- );

SELECT 1; -- no-op: run prisma/seed via npm run db:seed
