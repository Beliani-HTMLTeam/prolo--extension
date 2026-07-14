export type TimerConfig = {
  timerUrls: string[];
  freebieSrc?: string;
  backgroundColor?: string;
  insertSlugInFreebie?: boolean;
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
