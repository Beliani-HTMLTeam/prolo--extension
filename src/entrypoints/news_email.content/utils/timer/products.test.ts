/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import type { ProductRaw } from '@/entrypoints/saved_details.content/types';
import { buildFreebieShops } from './products';

const MASTER = '367111';
const OTHER_MASTER = '227506';

const row = (
  id: string,
  username: string,
  masterSa: string | undefined,
  price: string,
  inactive: '0' | '1' = '0',
): ProductRaw => ({
  saved_params: { username, master_sa: masterSa, ShopPrice: price, ShopHPrice: '' },
  data: { id, username, master_sa: masterSa, inactive },
  article_name: 'FLORETTA',
  shop_description: { automatic_titles: {} },
});

describe('buildFreebieShops', () => {
  // Same shape as live master 367111: another master's old slaves come first in getList.
  const rows: ProductRaw[] = [
    row('246532', 'Beliani FR', OTHER_MASTER, '109.99', '1'),
    row('244746', 'Beliani DE', OTHER_MASTER, '89.99', '1'),
    row('367111', 'Beliani', '0', '69.99'),
    row('367115', 'Beliani FR', MASTER, '49.99'),
    row('367200', 'Beliani UK', MASTER, '70.00', '1'),
    row('367113', 'Beliani UK', MASTER, '59.99'),
  ];

  const shops = buildFreebieShops(rows, MASTER);

  test('ignores slaves of another master with the same seller', () => {
    expect(shops.fr?.lowPrice).toBe('49.99');
  });

  test('prefers the active own row over an inactive own row', () => {
    expect(shops.uk?.lowPrice).toBe('59.99');
  });

  test('uses the master row (master_sa "0") for CH', () => {
    expect(shops.chde?.lowPrice).toBe('69.99');
    expect(shops.chfr?.lowPrice).toBe('69.99');
  });

  test('returns no product when only another master has the seller', () => {
    expect(shops.de).toBeUndefined();
  });

  test('treats a row without master_sa as own and falls back to data.master_sa', () => {
    const result = buildFreebieShops(
      [
        { saved_params: { username: 'Beliani IT', ShopPrice: '10.00' }, data: { master_sa: OTHER_MASTER } },
        { saved_params: { username: 'Beliani PT', ShopPrice: '20.00' }, data: {} },
      ],
      MASTER,
    );
    expect(result.it).toBeUndefined();
    expect(result.pt?.lowPrice).toBe('20.00');
  });

  test('keeps list order when every own row is inactive', () => {
    const result = buildFreebieShops(
      [row('1', 'Beliani SE', MASTER, '11.00', '1'), row('2', 'Beliani SE', MASTER, '12.00', '1')],
      MASTER,
    );
    expect(result.se?.lowPrice).toBe('11.00');
  });
});
