import { Prisma } from "@prisma/client";
import { resolveImageUrlForClient } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";

type SectionWithItemsRow = {
  id: string;
  title: string;
  showTitle?: boolean;
  logoUrl: string | null;
  logoTitle: string | null;
  logoDescription: string | null;
  backgroundColor: string | null;
  cardBackgroundColor: string | null;
  items: Array<{
    id: string;
    sectionId: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    price: Prisma.Decimal;
    oldPrice: Prisma.Decimal | null;
    stock: number;
  }>;
};

type PublicSectionView = {
  id: string;
  title: string;
  showTitle: boolean;
  logoUrl: string | null;
  logoTitle: string | null;
  logoDescription: string | null;
  backgroundColor: string | null;
  cardBackgroundColor: string | null;
  items: Array<{
    id: string;
    sectionId: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    price: string;
    oldPrice: string | null;
    stock: number;
  }>;
};

type PublicSectionNavItem = {
  id: string;
  title: string;
};

async function queryVisibleSections(where?: { id?: string }) {
  let rows: SectionWithItemsRow[];
  try {
    rows = await prisma.customStoreSection.findMany({
      where: { isVisible: true, ...where },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: {
        items: {
          where: { isActive: true },
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          take: 500,
          select: {
            id: true,
            sectionId: true,
            title: true,
            subtitle: true,
            imageUrl: true,
            price: true,
            oldPrice: true,
            stock: true,
          },
        },
      },
      take: where?.id ? 1 : 20,
    });
  } catch (error) {
    const isMissingShowTitleColumn =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2022" &&
      typeof error.meta?.column === "string" &&
      error.meta.column.includes("showTitle");
    if (!isMissingShowTitleColumn) throw error;
    rows = await prisma.customStoreSection.findMany({
      where: { isVisible: true, ...where },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        logoUrl: true,
        logoTitle: true,
        logoDescription: true,
        backgroundColor: true,
        cardBackgroundColor: true,
        items: {
          where: { isActive: true },
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          take: 500,
          select: {
            id: true,
            sectionId: true,
            title: true,
            subtitle: true,
            imageUrl: true,
            price: true,
            oldPrice: true,
            stock: true,
          },
        },
      },
      take: where?.id ? 1 : 20,
    });
  }
  return rows;
}

function mapSection(row: SectionWithItemsRow): PublicSectionView {
  return {
    id: row.id,
    title: row.title,
    showTitle: row.showTitle ?? true,
    logoUrl: row.logoUrl ? resolveImageUrlForClient(row.logoUrl) ?? row.logoUrl : null,
    logoTitle: row.logoTitle,
    logoDescription: row.logoDescription,
    backgroundColor: row.backgroundColor,
    cardBackgroundColor: row.cardBackgroundColor,
    items: row.items.map((item) => ({
      id: item.id,
      sectionId: item.sectionId,
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: resolveImageUrlForClient(item.imageUrl) ?? item.imageUrl,
      price: item.price.toString(),
      oldPrice: item.oldPrice?.toString() ?? null,
      stock: item.stock,
    })),
  };
}

export async function getVisibleCustomStoreSections() {
  try {
    const rows = await queryVisibleSections();
    return rows.map(mapSection).filter((section) => section.items.length > 0);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return [];
    }
    throw error;
  }
}

export async function getVisibleCustomStoreSectionNavItems() {
  try {
    const rows = await queryVisibleSections();
    return rows
      .filter((row) => row.items.length > 0)
      .map((row) => ({ id: row.id, title: row.title }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return [];
    }
    throw error;
  }
}

export async function getVisibleCustomStoreSectionPageData(sectionId: string): Promise<{
  section: PublicSectionView | null;
  navItems: PublicSectionNavItem[];
}> {
  try {
    const rows = await queryVisibleSections();
    const populatedRows = rows.filter((row) => row.items.length > 0);
    const sectionRow = populatedRows.find((row) => row.id === sectionId) ?? null;
    return {
      section: sectionRow ? mapSection(sectionRow) : null,
      navItems: populatedRows.map((row) => ({ id: row.id, title: row.title })),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return { section: null, navItems: [] };
    }
    throw error;
  }
}

export async function getVisibleCustomStoreSectionById(sectionId: string) {
  try {
    const rows = await queryVisibleSections({ id: sectionId });
    const section = rows[0] ? mapSection(rows[0]) : null;
    if (!section || section.items.length === 0) return null;
    return section;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return null;
    }
    throw error;
  }
}
