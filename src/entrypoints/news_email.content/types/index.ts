export type FreebieShopData = {
  name: string;
  description: string;
  lowPrice: string;
  highPrice: string;
};

export type FreebieItem = {
  masterId: string;
  src: string;
  titlePhrase?: string;
  shops?: Record<string, FreebieShopData>;
};

export type TimerHeaderTexts = { title: string; subtitle: string };

export type TimerHeader = {
  sheet: string;
  titleRow: number;
  subtitleRow: number;
  texts?: Record<string, TimerHeaderTexts>;
};

export type TimerConfig = {
  themeId: string;
  deadline: string;
  freebies:
    | { kind: 'none' }
    | { kind: 'image'; src: string; insertSlug?: boolean }
    | { kind: 'list'; columns: 1 | 2; items: FreebieItem[] };
  header?: TimerHeader;
};

export type BannerType = {
  id: string;
  order: number;
  date?: string; // e.g. "2026.06.23"
  isCustom?: boolean;
  customSrcSuffix?: string;
  customHref?: string;
  timerConfig?: TimerConfig;
};
