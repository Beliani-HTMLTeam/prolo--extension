import { fetchProducts } from '@/entrypoints/saved_details.content/fetchProducts';
import { pickOwnProductRow } from '@/entrypoints/saved_details.content/masterRows';
import type { ProductRaw } from '@/entrypoints/saved_details.content/types';
import type { FreebieShopData } from '../../types';

type ShopMeta = {
  seller: string;
  priceKey: string;
  language: string;
};

export const SHOP_META: Record<string, ShopMeta> = {
  uk: { seller: 'Beliani UK', priceKey: 'UK', language: 'english' },
  pl: { seller: 'Beliani PL', priceKey: 'PL', language: 'polish' },
  de: { seller: 'Beliani DE', priceKey: 'DE', language: 'germanDE' },
  at: { seller: 'Beliani AT', priceKey: 'AT', language: 'germanDE' },
  chde: { seller: 'Beliani', priceKey: 'CHDE', language: 'german' },
  chfr: { seller: 'Beliani', priceKey: 'CHDE', language: 'french' },
  nl: { seller: 'Beliani NL', priceKey: 'NL', language: 'dutch' },
  fr: { seller: 'Beliani FR', priceKey: 'FR', language: 'french' },
  es: { seller: 'Beliani SP', priceKey: 'ES', language: 'spanish' },
  pt: { seller: 'Beliani PT', priceKey: 'PT', language: 'portugal' },
  it: { seller: 'Beliani IT', priceKey: 'IT', language: 'italian' },
  dk: { seller: 'Beliani DK', priceKey: 'DK', language: 'danish' },
  no: { seller: 'Beliani NO', priceKey: 'NO', language: 'norsk' },
  fi: { seller: 'Beliani FI', priceKey: 'FI', language: 'finnish' },
  se: { seller: 'Beliani SE', priceKey: 'SE', language: 'swedish' },
  cz: { seller: 'Beliani CZ', priceKey: 'CZ', language: 'czech' },
  sk: { seller: 'Beliani SK', priceKey: 'SK', language: 'slovak' },
  hu: { seller: 'Beliani HU', priceKey: 'HU', language: 'Hungarian' },
  ro: { seller: 'Beliani RO', priceKey: 'RO', language: 'romanian' },
  benl: { seller: 'Beliani BE', priceKey: 'BE', language: 'dutch' },
  befr: { seller: 'Beliani BE', priceKey: 'BE', language: 'french' },
};

const cache = new Map<string, Promise<Record<string, FreebieShopData>>>();

const toPrice = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
};

const sellerOf = (row: ProductRaw): string =>
  String(row.saved_params?.username ?? '')
    .replace(/\./g, '')
    .trim();

export const buildFreebieShops = (rows: ProductRaw[], masterId: string): Record<string, FreebieShopData> => {
  const result: Record<string, FreebieShopData> = {};

  for (const [slug, meta] of Object.entries(SHOP_META)) {
    // Only this master's own rows: getList also returns old slaves of other masters with the same seller.
    const row = pickOwnProductRow(rows, masterId, item => sellerOf(item) === meta.seller);
    if (!row) continue;

    const name = String(row.article_name ?? '').trim();
    const title = String(row.shop_description?.automatic_titles?.[meta.language] ?? '');

    result[slug] = {
      name,
      description: name ? title.replace(name, '').trim() : title.trim(),
      lowPrice: toPrice(row.saved_params?.ShopPrice),
      highPrice: slug === 'pl' ? '' : toPrice(row.saved_params?.ShopHPrice),
    };
  }

  return result;
};

const load = async (masterId: string): Promise<Record<string, FreebieShopData>> => {
  const rows = await fetchProducts([{ main_id: masterId }]);
  return buildFreebieShops(rows, masterId);
};

export const fetchFreebieShops = (masterId: string): Promise<Record<string, FreebieShopData>> => {
  const key = masterId.trim();
  let promise = cache.get(key);
  if (!promise) {
    promise = load(key);
    promise.catch(() => cache.delete(key));
    cache.set(key, promise);
  }
  return promise;
};
