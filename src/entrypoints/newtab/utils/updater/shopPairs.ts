export const SHOP_PAIRS: Record<string, string> = {
  BEFR: 'BENL',
  BENL: 'BEFR',
  CHDE: 'CHFR',
  CHFR: 'CHDE',
}

export const getPairedSlug = (slug: string): string | null => {
  return SHOP_PAIRS[slug] || null
}

export const isPairedShop = (slug: string): boolean => {
  return !!SHOP_PAIRS[slug]
}