import { SHOP_ID_MAP } from './shopConfig';

export const shopIdMap: Record<string, number> = SHOP_ID_MAP;

export const getShopId = (shop: string): number | null => {
  return shopIdMap[shop] ?? null;
};
