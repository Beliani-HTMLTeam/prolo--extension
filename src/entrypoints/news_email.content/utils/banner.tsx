import { BannerType } from '../types';

const previewDomain = 'https://www.beliani.ch';
const pictureServerLocaleSlug = 'uk';

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}.${month}.${day}`;
};

export const getDaysBetweenInclusive = (start: Date, end: Date) => {
  if (end.getTime() < start.getTime()) return [] as string[];

  const current = new Date(start);
  current.setHours(12, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(12, 0, 0, 0);

  const days: string[] = [];

  while (current.getTime() <= endDate.getTime()) {
    days.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

export const normalizeBannerOrder = (banners: BannerType[]) =>
  banners.map((banner, index) => ({
    ...banner,
    order: index + 1,
  }));

export const buildBannerUrl = (date: string, type: 'mobile' | 'desktop', localeSlug = pictureServerLocaleSlug) => {
  const compactDate = date.replace(/\./g, '');
  return `https://pictureserver.net/static/${date.slice(0, 4)}/${localeSlug}${compactDate}${type === 'mobile' ? '_mb' : 'b'}.png?ver=30`;
};

export const buildBannerLink = (date: string) => {
  const [year, month, day] = date.split('.');
  return `/content/lp${year.slice(2)}-${month}-${day}`;
};

export const buildCustomBannerImageSrc = (
  srcSuffix: string,
  year = new Date().getFullYear().toString(),
  localeSlug = pictureServerLocaleSlug,
) => {
  const normalizedSuffix = srcSuffix.trim().replace(/^\/+/, '');
  return `https://pictureserver.net/static/${year}/${localeSlug}${normalizedSuffix}.png`;
};

const normalizeBannerSearchValue = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^0-9.a-z-]/g, '');

const stripDomainFromHref = (href: string) => {
  const trimmedHref = href.trim();
  if (!trimmedHref) return '';

  try {
    const parsedUrl = new URL(trimmedHref);
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return trimmedHref.replace(/^https?:\/\/[^/]+/i, '') || trimmedHref;
  }
};

export const normalizeBannerHref = (href: string) => {
  const strippedHref = stripDomainFromHref(href);
  if (!strippedHref) return '';

  return strippedHref.startsWith('/') ? strippedHref : `/${strippedHref}`;
};

export const buildPreviewBannerHref = (href: string) => `${previewDomain}${normalizeBannerHref(href)}`;

export const buildBannerHref = (banner: BannerType, newsletterId?: string) => {
  const baseHref = buildPreviewBannerHref(banner.customHref ?? buildBannerLink(banner.date ?? ''));
  if (newsletterId) {
    try {
      const url = new URL(baseHref);
      url.searchParams.set('utm_source', 'newsletter');
      url.searchParams.set('utm_medium', 'email');
      url.searchParams.set('utm_campaign', newsletterId);
      return url.toString();
    } catch {
      return baseHref;
    }
  }
  return baseHref;
};

export const buildBannerImageSrc = (banner: BannerType) =>
  banner.isCustom && banner.customSrcSuffix
    ? buildCustomBannerImageSrc(banner.customSrcSuffix)
    : buildBannerUrl(banner.date ?? '', 'mobile');

export const buildFreebieImageSrc = (freebieSrc: string) => {
  const year = freebieSrc.slice(0, 4);
  return `https://pictureserver.net/static/${year}/${freebieSrc}free.png?ver=30`;
};

export const matchesBannerSearchTerm = (date: string, query: string) => {
  const normalizedQuery = normalizeBannerSearchValue(query);
  if (!normalizedQuery) return true;

  const [year, month, day] = date.split('.');
  const searchVariants = [
    date,
    `${day}.${month}`,
    `${month}.${day}`,
    `${day}${month}`,
    `${month}${day}`,
    `${year}${month}${day}`,
    `${day}.${month}.${year}`,
    `${month}.${day}.${year}`,
  ];

  return searchVariants.some(variant => normalizeBannerSearchValue(variant).includes(normalizedQuery));
};

import { SHOP_SLUGS } from '../constants/shops';

type Translations = {
  header: Record<string, any>;
  footer: Record<string, any>;
  templates: Record<string, any>;
} | null;

const getTranslationVal = (dict: Record<string, any>, key: string, slug: string): string | null => {
  const slugArray: string[] = dict['slug'] ?? [];
  const idx = slugArray.indexOf(slug);
  if (idx === -1) return null;
  const vals = dict[key];
  if (!Array.isArray(vals)) return null;
  const raw = vals[idx];
  if (raw === null || raw === undefined) return null;

  const str = String(raw)
    .replace(/<br\s*\/?>/gi, '')
    .trim();
  return str || null;
};

const buildRenderContext = (
  translations: Translations,
  slug: string,
  banners: BannerType[],
  newsletterId: string = '',
): Record<string, any> => {
  const ctx: Record<string, any> = {
    utm: '?utm_source=newsletter&utm_medium=email&utm_campaign=',
    id: newsletterId,
  };

  const dicts: Array<[string, Record<string, any> | undefined]> = [
    ['header', translations?.header],
    ['footer', translations?.footer],
    ['templates', translations?.templates],
  ];

  for (const [dictName, dict] of dicts) {
    if (!dict) continue;
    for (const key of Object.keys(dict)) {
      if (key === 'slug') continue;
      const val = getTranslationVal(dict, key, slug);
      ctx[`${dictName}["${key}"]`] = val ?? '';
    }
  }

  const topHref = (ctx['header["Top image href"]'] as string) || '';
  const domain = topHref.replace(/\/$/, ''); // strip trailing slash

  const headerSlugArr: string[] = translations?.header?.['slug'] ?? [];
  const apiSlugIdx = headerSlugArr.indexOf(slug);

  const orderedBanners = [...banners].sort((a, b) => a.order - b.order);
  ctx['campaigns'] = orderedBanners.map((banner, i) => {
    const isLast = i === orderedBanners.length - 1;
    const date = banner.date ?? '';
    const year = date.slice(0, 4) || String(new Date().getFullYear());

    const contentPath = banner.customHref ? normalizeBannerHref(banner.customHref) : date ? buildBannerLink(date) : '';
    const bannerHref = `${domain}${contentPath}`;

    const bannerImgSrc =
      banner.isCustom && banner.customSrcSuffix
        ? buildCustomBannerImageSrc(banner.customSrcSuffix, year, slug)
        : buildBannerUrl(date, 'mobile', slug);

    const shopSlugIdx = SHOP_SLUGS.indexOf(slug);
    const timerUrls = banner.timerConfig?.timerUrls ?? [];
    const timerUrl = shopSlugIdx !== -1 ? (timerUrls[shopSlugIdx] ?? timerUrls[0] ?? '') : (timerUrls[0] ?? '');

    console.log('timer for slug ', slug, ' is ', timerUrl, 'shopSlugIdx', shopSlugIdx);

    const timerBg = banner.timerConfig?.backgroundColor ?? '#ff2f00';

    const freebieRaw = banner.timerConfig?.freebieSrc ?? '';
    const hasFreebie = !!freebieRaw;
    const freebieYear = freebieRaw.slice(0, 4);

    const finalFreebie = hasFreebie && banner.timerConfig?.insertSlugInFreebie ? `${slug}${freebieRaw}` : freebieRaw;

    return {
      banner_href: bannerHref,
      banner_img_src: bannerImgSrc,
      timer_url: timerUrl,
      timer_bg: timerBg,
      freebie: hasFreebie ? finalFreebie : '',
      freebie_year: freebieYear,
      freebie_href: hasFreebie ? bannerHref : '',
      last: isLast,
    };
  });

  return ctx;
};

const findClosingTag = (tpl: string, key: string, searchFrom: number): number => {
  const openPatterns = [`{{#${key}}}`, `{{^${key}}}`];
  const closeTag = `{{/${key}}}`;
  let depth = 1;
  let pos = searchFrom;

  while (depth > 0 && pos < tpl.length) {
    const nextClose = tpl.indexOf(closeTag, pos);
    if (nextClose === -1) return -1;

    let nearestOpen = Infinity;
    let nearestOpenLen = 0;
    for (const pat of openPatterns) {
      const idx = tpl.indexOf(pat, pos);
      if (idx !== -1 && idx < nearestOpen) {
        nearestOpen = idx;
        nearestOpenLen = pat.length;
      }
    }

    if (nearestOpen < nextClose) {
      depth++;
      pos = nearestOpen + nearestOpenLen;
    } else {
      depth--;
      if (depth === 0) return nextClose;
      pos = nextClose + closeTag.length;
    }
  }

  return -1;
};

const renderMustache = (template: string, ctx: Record<string, any>): string => {
  const sectionRe = /\{\{([#^])([^}]+)\}\}/;
  const match = sectionRe.exec(template);

  if (!match) {
    return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('^')) return '';
      const val = ctx[trimmed];
      return val !== null && val !== undefined ? String(val) : '';
    });
  }

  const [fullOpen, type, key] = match;
  const openStart = match.index;
  const contentStart = openStart + fullOpen.length;
  const closeStart = findClosingTag(template, key, contentStart);

  if (closeStart === -1) {
    return renderMustache(template.replace(fullOpen, ''), ctx);
  }

  const before = template.slice(0, openStart);
  const content = template.slice(contentStart, closeStart);
  const after = template.slice(closeStart + `{{/${key}}}`.length);

  const val = ctx[key] ?? null;
  let expanded: string;

  if (type === '#') {
    if (Array.isArray(val)) {
      expanded = val.map(item => renderMustache(content, { ...ctx, ...item })).join('');
    } else if (val) {
      expanded = renderMustache(content, ctx);
    } else {
      expanded = '';
    }
  } else {
    const isFalsy = Array.isArray(val) ? val.length === 0 : !val;
    expanded = isFalsy ? renderMustache(content, ctx) : '';
  }

  return renderMustache(before + expanded + after, ctx);
};

export const buildNewsletterPreviewHtml = (
  template: string,
  banners: BannerType[],
  slugIndex: number = 0,
  newsletterId?: string,
  translations: Translations = null,
): string => {
  const slug = SHOP_SLUGS[slugIndex] ?? 'uk';
  const ctx = buildRenderContext(translations, slug, banners, newsletterId ?? '');
  return renderMustache(template, ctx);
};

const Banner = ({
  date,
  src,
  type,
  alt,
  localeSlug,
}: {
  date?: string;
  src?: string;
  type: 'mobile' | 'desktop';
  alt?: string;
  localeSlug?: string;
}) => {
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = `https://placehold.co/${type === 'mobile' ? '650x490' : '610x181'}`;
  };

  const resolvedSrc = src ?? (date ? buildBannerUrl(date, type, localeSlug) : '');

  return (
    <img
      onError={handleImageError}
      src={resolvedSrc}
      alt={alt ?? (date ? `Banner for ${date} - ${type}` : 'Banner preview')}
    />
  );
};

export { Banner };
