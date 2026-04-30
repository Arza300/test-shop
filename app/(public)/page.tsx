import { HomeHeroSection, type HomeHeroSlideVisual } from "@/components/home-hero-section";
import { Bb8DroidSection } from "@/components/bb8-droid-section";
import { LeadingBrandsSection } from "@/components/leading-brands-section";
import { CustomStoreSectionShowcaseItem } from "@/components/custom-store-sections-showcase";
import { Prisma } from "@prisma/client";
import type { ReactNode } from "react";
import { resolveImageUrlForClient } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import { getVisibleCustomStoreSections } from "@/lib/custom-store-sections-public";
import {
  buildOrderedHomeSectionKeys,
  getCustomSectionIdFromKey,
  isStaticHomeSectionKey,
  type HomeSectionKey,
  type StaticHomeSectionKey,
} from "@/lib/home-sections";

export const dynamic = "force-dynamic";

const DB_SLIDE_GRADIENT = "from-slate-900 via-slate-800 to-indigo-950";

async function getVisibleBrands() {
  try {
    const rows = await prisma.brand.findMany({
      where: { isVisible: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 48,
      select: { name: true, slug: true, logoUrl: true },
    });
    return rows.map((r) => ({
      name: r.name,
      slug: r.slug,
      logoUrl: resolveImageUrlForClient(r.logoUrl) ?? r.logoUrl,
    }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return [];
    }
    throw error;
  }
}

async function getHomeSectionOrder() {
  try {
    const rows = await prisma.homepageSectionOrder.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { sectionKey: true },
      take: 100,
    });
    return rows.map((row) => row.sectionKey);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return [];
    }
    throw error;
  }
}

export default async function HomePage() {
  const [rows, sidePanel, leadingBrands, customSections, homeSectionsOrder] = await Promise.all([
    prisma.homeHeroSlide.findMany({
      orderBy: { position: "asc" },
      select: { imageUrl: true, headline: true, subline: true, linkedProductId: true },
    }),
    prisma.homeHeroSidePanel.findUnique({
      where: { id: "main" },
      select: { imageUrl: true, linkedProductId: true, linkedSectionId: true },
    }),
    getVisibleBrands(),
    getVisibleCustomStoreSections(),
    getHomeSectionOrder(),
  ]);

  const slides: HomeHeroSlideVisual[] = rows.map((r) => ({
    image: resolveImageUrlForClient(r.imageUrl) ?? r.imageUrl,
    title: r.headline ?? "",
    sub: r.subline ?? "",
    gradient: DB_SLIDE_GRADIENT,
    href: r.linkedProductId ? `/shop/item/${r.linkedProductId}` : undefined,
  }));

  const staticSectionNodes: Record<StaticHomeSectionKey, ReactNode> = {
    bb8: (
      <div className="mt-6 sm:mt-8">
        <Bb8DroidSection />
      </div>
    ),
    leadingBrands: <LeadingBrandsSection brands={leadingBrands} className="mt-10 sm:mt-12" />,
  };
  const customSectionById = new Map(customSections.map((section) => [section.id, section]));
  const orderedSectionKeys: HomeSectionKey[] = buildOrderedHomeSectionKeys({
    storedKeys: homeSectionsOrder,
    customSectionIds: customSections.map((section) => section.id),
  });

  return (
    <div className="w-full">
      <HomeHeroSection
        slides={slides}
        sidePanelImageUrl={
          sidePanel?.imageUrl ? resolveImageUrlForClient(sidePanel.imageUrl) ?? sidePanel.imageUrl : null
        }
        sidePanelHref={
          sidePanel?.linkedProductId
            ? `/shop/item/${sidePanel.linkedProductId}`
            : sidePanel?.linkedSectionId
              ? `/shop/section/${sidePanel.linkedSectionId}`
              : undefined
        }
      />
      {orderedSectionKeys.map((sectionKey) => {
        if (isStaticHomeSectionKey(sectionKey)) {
          return <div key={sectionKey}>{staticSectionNodes[sectionKey]}</div>;
        }
        const customSectionId = getCustomSectionIdFromKey(sectionKey);
        if (!customSectionId) return null;
        const section = customSectionById.get(customSectionId);
        if (!section) return null;
        return <CustomStoreSectionShowcaseItem key={section.id} section={section} />;
      })}
    </div>
  );
}
