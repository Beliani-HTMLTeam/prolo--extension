import { type ShopDetails } from './ShopDetails';

export type ProductWithShops = {
  id: string;
  name: string;
  shops: Record<string, ShopDetails>;
};
