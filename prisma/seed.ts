import { PrismaClient, ProductFormat, ProductType, Platform, OrderStatus, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { DEFAULT_HOME_HERO_SLIDES } from "../lib/default-home-hero-slides";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  const userEmail = "user@example.com";
  const password = await hash("Password123!", 12);

  await prisma.review.deleteMany();
  await prisma.homeHeroSlide.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { email: adminEmail, name: "Admin", passwordHash: password, role: Role.ADMIN },
  });
  const user = await prisma.user.create({
    data: { email: userEmail, name: "Demo User", passwordHash: password, role: Role.USER },
  });
  const catGames = await prisma.category.create({ data: { name: "Games", slug: "games" } });
  const catCards = await prisma.category.create({ data: { name: "Gift Cards", slug: "gift-cards" } });
  const catAcc = await prisma.category.create({ data: { name: "Accessories", slug: "accessories" } });

  const placeholder = "/placeholder.svg";

  const p1 = await prisma.product.create({
    data: {
      title: "Nebula Tactics (PC — Digital)",
      slug: "nebula-tactics-pc",
      description:
        "Turn-based strategy with a sci-fi story. This is sample placeholder copy for the seed catalog.",
      price: 39.99,
      type: ProductType.GAME,
      format: ProductFormat.DIGITAL,
      platform: Platform.PC,
      stock: 100,
      categoryId: catGames.id,
      images: { create: [{ url: placeholder, position: 0 }] },
    },
  });
  const p2 = await prisma.product.create({
    data: {
      title: "Crimson Arena (PS5 — Physical)",
      slug: "crimson-arena-ps5",
      description: "Competitive brawler with local and online play. Placeholder description text.",
      price: 49.99,
      type: ProductType.GAME,
      format: ProductFormat.PHYSICAL,
      platform: Platform.PLAYSTATION,
      stock: 30,
      categoryId: catGames.id,
      images: { create: [{ url: placeholder, position: 0 }] },
    },
  });
  const p3 = await prisma.product.create({
    data: {
      title: "Store Credit $25",
      slug: "store-credit-25",
      description: "Digital gift card for our store. Delivered to your account email after purchase.",
      price: 25,
      type: ProductType.GIFT_CARD,
      format: ProductFormat.DIGITAL,
      platform: Platform.OTHER,
      stock: 999,
      categoryId: catCards.id,
      images: { create: [{ url: placeholder, position: 0 }] },
    },
  });
  const p4 = await prisma.product.create({
    data: {
      title: "Pro Controller Pad",
      slug: "pro-controller-pad",
      description: "Ergonomic gamepad with textured grips. Placeholder product for accessories.",
      price: 59.99,
      type: ProductType.ACCESSORY,
      format: ProductFormat.PHYSICAL,
      platform: Platform.XBOX,
      stock: 12,
      categoryId: catAcc.id,
      images: { create: [{ url: placeholder, position: 0 }] },
    },
  });

  await prisma.review.create({
    data: { productId: p1.id, userId: user.id, rating: 5, comment: "Great seed review." },
  });

  const defaultBrand = await prisma.brand.create({
    data: {
      name: "Steam",
      slug: "steam",
      logoUrl: placeholder,
      isVisible: true,
      position: 0,
    },
  });

  const defaultSection = await prisma.customStoreSection.create({
    data: {
      title: "بطاقات رقمية",
      showTitle: true,
      isVisible: true,
      position: 0,
    },
  });

  await prisma.customStoreSectionItem.createMany({
    data: [
      {
        sectionId: defaultSection.id,
        title: "بطاقة ستيم 10 دولار",
        subtitle: "تفعيل فوري على الحساب",
        imageUrl: placeholder,
        price: 10,
        oldPrice: 12,
        stock: 100,
        isActive: true,
        position: 0,
      },
      {
        sectionId: defaultSection.id,
        title: "بطاقة ستيم 20 دولار",
        subtitle: "تفعيل فوري على الحساب",
        imageUrl: placeholder,
        price: 20,
        oldPrice: 24,
        stock: 100,
        isActive: true,
        position: 1,
      },
    ],
  });

  await prisma.brandProduct.create({
    data: {
      brandId: defaultBrand.id,
      productId: p1.id,
    },
  });

  const paymentMethod = await prisma.paymentMethod.create({
    data: {
      name: "فودافون كاش",
      phoneNumber: "01000000000",
      transferProofInstruction: "بعد التحويل، أرسل صورة تأكيد العملية على رقم الواتساب الموضح.",
      supportNumber: "01111111111",
      isActive: true,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      paymentMethodId: paymentMethod.id,
      status: OrderStatus.COMPLETED,
      total: 39.99,
      shippingName: "Demo User",
      shippingLine1: "1 Example St",
      shippingCity: "Cairo",
      shippingPostal: "12345",
      shippingCountry: "EG",
    },
  });
  await prisma.orderItem.create({
    data: {
      orderId: order.id,
      itemType: "PRODUCT",
      itemId: p1.id,
      titleSnapshot: p1.title,
      productId: p1.id,
      quantity: 1,
      unitPrice: p1.price,
    },
  });

  await prisma.homeHeroSlide.createMany({
    data: DEFAULT_HOME_HERO_SLIDES.map((d, i) => ({
      imageUrl: d.imageUrl,
      headline: d.headline,
      subline: d.subline,
      position: i,
    })),
  });

  console.log("Seeded: admin =", admin.email, "user =", userEmail, "password = Password123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
