import { mentionToShopsMap } from '../lib/shopMaps';
import { TABLE_SHOP_ORDER, SHOP_ALIASES } from '../lib/shopConfig';
import type { ChecklistTableRow } from '../lib/types';

export const TABLE_HEADERS = [
  'SHOP',
  'Translations',
  'Timer Done',
  'Push Done',
  'Test Sent',
  'Test Request',
  'NSLT ID',
  'NSLT Accepted',
  'LP ID',
  'LP Accepted',
];

export const CGB_HEADERS = ['SHOP', 'Test Request'];

const knownShops = new Set<string>();
for (const shops of Object.values(mentionToShopsMap)) {
  for (const shop of shops) {
    knownShops.add(shop);
  }
}

for (const shop of TABLE_SHOP_ORDER) {
  knownShops.add(shop);
}

const translationGroupToShops: Record<string, string[]> = {
  DACH: ['AT', 'CHDE', 'DE'],
};

const shopGroupAliases: Record<string, string[]> = {
  BE: ['BEFR', 'BENL'],
};

export const normalizeShopCode = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

const parseItemId = (text?: string | null) => {
  if (!text) return null;
  const match = text.match(/(?:\?|&)id=(\d+)/);
  return match ? match[1] : null;
};

export const normalizeTitle = (title: string) => title.trim().toLowerCase();

export const parseCheckpointDescription = (description: string) => {
  const normalizedDescription = description.trim();
  const [rawCodeTab, restTab] = normalizedDescription.split(/\t/, 2);

  const firstToken = normalizedDescription.split(/\s+/)[0] ?? '';
  const candidateCode = rawCodeTab && !rawCodeTab.includes(' ') ? rawCodeTab : firstToken;

  const normalizedCode = candidateCode
    .trim()
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  const rest = restTab ?? normalizedDescription.slice(firstToken.length).trim();

  const aliasResolved = SHOP_ALIASES[normalizedCode] ?? normalizedCode;

  if (knownShops.has(aliasResolved)) {
    return {
      shopCodes: [aliasResolved],
      itemId: parseItemId(rest),
    };
  }

  if (translationGroupToShops[aliasResolved]) {
    return {
      shopCodes: translationGroupToShops[aliasResolved],
      itemId: parseItemId(rest),
    };
  }

  if (shopGroupAliases[aliasResolved]) {
    return {
      shopCodes: shopGroupAliases[aliasResolved],
      itemId: parseItemId(rest),
    };
  }

  return null;
};

export const createRow = (shop: string, order: number): ChecklistTableRow => ({
  shop,
  nsltId: null,
  nsltAId: null,
  nsltBId: null,
  lpId: null,
  translations: 0,
  testRequest: 0,
  timerDone: 0,
  pushDone: 0,
  testSent: 0,
  nsltAccepted: 0,
  nsltAAccepted: 0,
  nsltBAccepted: 0,
  lpAccepted: 0,
  bannersApproved: 0,
  bannersCheckedMobile: 0,
  bannersCheckedDesktop: 0,
  cgbStatuses: {},
  cgbCheckpointRefs: {},
  checkpointRefs: {},
  order,
});
