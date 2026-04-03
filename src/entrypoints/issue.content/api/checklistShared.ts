import { mentionToShopsMap } from '../lib/shopMaps';
import { TABLE_SHOP_ORDER, SHOP_ALIASES } from '../lib/shopConfig';
import type { ChecklistColumn, ChecklistTableRow } from '../lib/types';

export const COLUMN_IDS = {
  SHOP: 'shop',
  TRANSLATIONS: 'translations',
  TIMER_DONE: 'timerDone',
  PUSH_DONE: 'pushDone',
  TEST_SENT: 'testSent',
  TEST_REQUEST: 'testRequest',
  NSLT_ID: 'nsltId',
  NSLT_ACCEPTED: 'nsltAccepted',
  NSLT_A_ID: 'nsltAId',
  NSLT_A_ACCEPTED: 'nsltAAccepted',
  NSLT_B_ID: 'nsltBId',
  NSLT_B_ACCEPTED: 'nsltBAccepted',
  LP_ID: 'lpId',
  LP_ACCEPTED: 'lpAccepted',
} as const;

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

export const createNewsletterColumns = (
  hasGroupedNslt: boolean,
  showTimer: boolean,
  showPush: boolean,
  options?: {
    includeTranslations?: boolean;
    includeLp?: boolean;
  },
): ChecklistColumn[] => {
  const includeTranslations = options?.includeTranslations ?? true;
  const includeLp = options?.includeLp ?? true;

  const columns: ChecklistColumn[] = [
    { id: COLUMN_IDS.SHOP, label: 'SHOP', kind: 'shop' },
  ];

  if (includeTranslations) {
    columns.push({ id: COLUMN_IDS.TRANSLATIONS, label: 'Translations', kind: 'request' });
  }

  if (showTimer) {
    columns.push({ id: COLUMN_IDS.TIMER_DONE, label: 'Timer Done', kind: 'status' });
  }
  if (showPush) {
    columns.push({ id: COLUMN_IDS.PUSH_DONE, label: 'Push Done', kind: 'status' });
  }

  columns.push({ id: COLUMN_IDS.TEST_SENT, label: 'Test Sent', kind: 'status' });
  columns.push({ id: COLUMN_IDS.TEST_REQUEST, label: 'Test Request', kind: 'request' });

  if (hasGroupedNslt) {
    columns.push({ id: COLUMN_IDS.NSLT_A_ID, label: 'NSLT A ID', kind: 'link', openAllLinks: true });
    columns.push({ id: COLUMN_IDS.NSLT_A_ACCEPTED, label: 'NSLT A Accepted', kind: 'status' });
    columns.push({ id: COLUMN_IDS.NSLT_B_ID, label: 'NSLT B ID', kind: 'link', openAllLinks: true });
    columns.push({ id: COLUMN_IDS.NSLT_B_ACCEPTED, label: 'NSLT B Accepted', kind: 'status' });
  } else {
    columns.push({ id: COLUMN_IDS.NSLT_ID, label: 'NSLT ID', kind: 'link', openAllLinks: true });
    columns.push({ id: COLUMN_IDS.NSLT_ACCEPTED, label: 'NSLT Accepted', kind: 'status' });
  }

  if (includeLp) {
    columns.push({ id: COLUMN_IDS.LP_ID, label: 'LP ID', kind: 'link', openAllLinks: true });
    columns.push({ id: COLUMN_IDS.LP_ACCEPTED, label: 'LP Accepted', kind: 'status' });
  }
  return columns;
};

export const createCgbColumns = (dynamicColumns: Array<{ id: string; label: string }>): ChecklistColumn[] => {
  return [
    { id: COLUMN_IDS.SHOP, label: 'SHOP', kind: 'shop' },
    ...dynamicColumns.map(column => ({ id: column.id, label: column.label, kind: 'status' as const })),
    { id: COLUMN_IDS.TEST_REQUEST, label: 'Test Request', kind: 'request' },
  ];
};

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
  columnStatuses: {},
  columnCheckpointRefs: {},
  columnValues: {},
  cgbStatuses: {},
  cgbCheckpointRefs: {},
  checkpointRefs: {},
  order,
});
