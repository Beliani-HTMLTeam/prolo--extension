import { type ShopDetails } from './ShopDetails';

export type ProductData = {
  name: string;
  shops: Record<string, ShopDetails>;
};
