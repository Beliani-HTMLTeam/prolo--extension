import { mentionToShopsMap } from './shopMaps';
import { TABLE_SHOP_ORDER } from './shopConfig';

const CONTENT_TEAM = ['580', '1672', '4397', '4568', '4599', '4974', '4975'];
const DACH_TEAM = ['919', '3026'];
const FR_TEAM = ['4433'];
const IT_TEAM = ['3653', '2401'];

export const SHOP_TRANSLATORS: Record<string, string[]> = {
  UK: CONTENT_TEAM,
  PL: CONTENT_TEAM,
  DE: DACH_TEAM,
  AT: DACH_TEAM,
  CHDE: DACH_TEAM,
  FR: FR_TEAM,
  CHFR: FR_TEAM,
  BEFR: FR_TEAM,
  IT: IT_TEAM,
  CHIT: IT_TEAM,
  ES: ['4157', '4717'],
  PT: ['3663'],
  SE: ['3722', '4927'],
  FI: ['3468', '4927'],
  NO: ['4315'],
  DK: ['3683', '3702'],
  HU: ['5303', '5743'],
  RO: ['4679', '4680'],
  NL: ['3734'],
  BENL: ['3734'],
  SK: ['3158', '3942'],
  CZ: ['4571', '5180'],
  HR: ['6004', '6005', '5692'],
  SI: ['5692'],
};

export type TranslatorGroup = {
  key: string;
  label: string;
  shops: string[];
  mentionId: string | null;
};

const shopRank = (shop: string) => {
  const index = (TABLE_SHOP_ORDER as readonly string[]).indexOf(shop);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const groupLabel = (tag: string, shops: string[]) => {
  if (shops.length === 1) return shops[0];
  return tag
    .replace(/^@|\(\d*\)$/g, '')
    .replace(/\s+(translation|team)$/i, '')
    .trim();
};

export const TRANSLATOR_GROUPS: TranslatorGroup[] = Object.entries(mentionToShopsMap)
  .map(([key, shops]) => ({
    key,
    label: groupLabel(key, shops),
    shops,
    mentionId: /\((\d+)\)/.exec(key)?.[1] ?? null,
  }))
  .sort((a, b) => Math.min(...a.shops.map(shopRank)) - Math.min(...b.shops.map(shopRank)));
