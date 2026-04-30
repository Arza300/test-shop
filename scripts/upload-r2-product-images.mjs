import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

async function loadDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  const raw = await fs.readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx < 1) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (!(k in process.env)) process.env[k] = v;
  }
}

const required = [
  "R2_ACCOUNT_ID",
  "R2_BUCKET_NAME",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_BASE_URL",
];

async function assertRequiredEnv() {
  await loadDotEnv();
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing env var: ${key}`);
    }
  }
}

const prisma = new PrismaClient();

async function main() {
  await assertRequiredEnv();
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBase = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  const filePath = path.join(process.cwd(), "public", "placeholder.svg");
  const body = await fs.readFile(filePath);

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  if (!products.length) {
    console.log("No products found.");
    return;
  }

  for (const p of products) {
    const key = `uploads/products/${p.slug}-${Date.now()}.svg`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/svg+xml",
      })
    );

    const url = `${publicBase}/${key}`;
    await prisma.productImage.deleteMany({ where: { productId: p.id } });
    await prisma.productImage.create({
      data: { productId: p.id, url, position: 0 },
    });

    console.log(`Uploaded + linked image for: ${p.title}`);
    console.log(`  -> ${url}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

