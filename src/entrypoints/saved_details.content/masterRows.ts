import type { ProductRaw } from './types';

export const belongsToMaster = (masterSa: unknown, masterId: string): boolean => {
  const value = String(masterSa ?? '').trim();
  return value === '' || value === '0' || value === masterId.trim();
};

export const productMasterSa = (row: ProductRaw): string | undefined =>
  row.saved_params?.master_sa || row.data?.master_sa || undefined;

export const pickOwnProductRow = (
  rows: ProductRaw[],
  masterId: string,
  matchesSeller: (row: ProductRaw) => boolean,
): ProductRaw | undefined => {
  const own = rows.filter(row => matchesSeller(row) && belongsToMaster(productMasterSa(row), masterId));
  
  return own.find(row => row.data?.inactive !== '1') ?? own[0];
};
