export const STATIC_HOME_SECTION_KEYS = ["bb8", "leadingBrands"] as const;
export const LEGACY_CUSTOM_GROUP_KEY = "customSections";
export const CUSTOM_SECTION_KEY_PREFIX = "custom:";

export type StaticHomeSectionKey = (typeof STATIC_HOME_SECTION_KEYS)[number];
export type HomeSectionKey = StaticHomeSectionKey | `${typeof CUSTOM_SECTION_KEY_PREFIX}${string}`;

export const DEFAULT_STATIC_HOME_SECTION_ORDER: StaticHomeSectionKey[] = [...STATIC_HOME_SECTION_KEYS];

export const HOME_SECTION_LABELS: Record<StaticHomeSectionKey, string> = {
  bb8: "قسم الروبوت المتحرك",
  leadingBrands: "العلامات التجارية",
};

export function getCustomSectionKey(sectionId: string): HomeSectionKey {
  return `${CUSTOM_SECTION_KEY_PREFIX}${sectionId}`;
}

export function isStaticHomeSectionKey(key: string): key is StaticHomeSectionKey {
  return STATIC_HOME_SECTION_KEYS.includes(key as StaticHomeSectionKey);
}

export function isCustomHomeSectionKey(key: string): key is `${typeof CUSTOM_SECTION_KEY_PREFIX}${string}` {
  return key.startsWith(CUSTOM_SECTION_KEY_PREFIX);
}

export function getCustomSectionIdFromKey(key: string): string | null {
  if (!isCustomHomeSectionKey(key)) return null;
  const id = key.slice(CUSTOM_SECTION_KEY_PREFIX.length).trim();
  return id.length ? id : null;
}

export function getHomeSectionLabel(params: {
  sectionKey: HomeSectionKey;
  customTitleById: Record<string, string>;
}): string {
  if (isStaticHomeSectionKey(params.sectionKey)) return HOME_SECTION_LABELS[params.sectionKey];
  const customId = getCustomSectionIdFromKey(params.sectionKey);
  if (!customId) return "قسم مخصص";
  return params.customTitleById[customId] ?? "قسم مخصص";
}

export function buildOrderedHomeSectionKeys(params: {
  storedKeys: string[];
  customSectionIds: string[];
}): HomeSectionKey[] {
  const customKeys = params.customSectionIds.map(getCustomSectionKey);
  const customKeySet = new Set(customKeys);
  const seen = new Set<HomeSectionKey>();
  const ordered: HomeSectionKey[] = [];

  const pushUnique = (key: HomeSectionKey) => {
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(key);
  };

  for (const rawKey of params.storedKeys) {
    if (isStaticHomeSectionKey(rawKey)) {
      pushUnique(rawKey);
      continue;
    }
    if (rawKey === LEGACY_CUSTOM_GROUP_KEY) {
      for (const customKey of customKeys) pushUnique(customKey);
      continue;
    }
    if (isCustomHomeSectionKey(rawKey) && customKeySet.has(rawKey)) {
      pushUnique(rawKey);
    }
  }

  for (const staticKey of DEFAULT_STATIC_HOME_SECTION_ORDER) {
    pushUnique(staticKey);
  }
  for (const customKey of customKeys) {
    pushUnique(customKey);
  }

  return ordered;
}
