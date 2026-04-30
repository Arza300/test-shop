import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`users-exist:${count}`);
    return;
  }

  const passwordHash = await hash("Password123!", 12);
  await prisma.user.createMany({
    data: [
      { email: "admin@example.com", name: "Admin", passwordHash, role: Role.USER },
      { email: "user@example.com", name: "Demo User", passwordHash, role: Role.USER },
    ],
  });
  console.log("seeded-users:2");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
