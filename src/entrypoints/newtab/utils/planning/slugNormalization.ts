export const normalizeSlugForSlug = (slug: string): string => {
  const NORMALIZATION: Record<string, string> = {
    ES: 'SP',
  };
  return NORMALIZATION[slug] || slug;
};
