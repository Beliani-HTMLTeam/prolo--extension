import { SHOP_SLUGS } from '../../constants/shops';
import { generateProloUrls } from '../../components/TimerBannerModal/prolo';
import type { FreebieItem, TimerConfig } from '../../types';
import { priceFormats } from './prices';
import { SHOP_META } from './products';
import { getTheme } from './themes';
import timerCss from './timer.css?raw';

export const TIMER_CSS = timerCss;

export type TimerRenderOptions = {
  config: TimerConfig;
  slug: string;
  href: string;
  phrase: (key: string) => string | null;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const spacer = (background: string) =>
  `<tr><td class="newsletterBottom20px" style="background-color: ${background};"></td></tr>`;

export const buildImageSrc = (src: string) =>
  /^https?:\/\//i.test(src) ? src : `https://pictureserver.net/static/${src.slice(0, 4)}/${src}`;

const formatPrice = (value: string, slug: string) => {
  const priceKey = SHOP_META[slug]?.priceKey;
  const format = priceKey ? priceFormats[priceKey] : undefined;
  return value && format ? format(value) : '';
};

type FreebieRow = {
  src: string;
  title: string;
  oldPrice: string;
};

const getFreebieRow = (item: FreebieItem, options: TimerRenderOptions): FreebieRow | null => {
  const shop = item.shops?.[options.slug];
  if (!shop) return null;

  const phrase = item.titlePhrase ? (options.phrase(item.titlePhrase) ?? item.titlePhrase) : null;
  const title = phrase ? `${phrase} ${shop.name}`.trim() : shop.description || shop.name;
  const oldPrice = formatPrice(shop.highPrice, options.slug) || formatPrice(shop.lowPrice, options.slug);

  return { src: buildImageSrc(item.src), title: escapeHtml(title), oldPrice };
};

type FreebieStyle = {
  text: string;
  free: string;
  line: string;
  freeText: string;
  href: string;
};

// keeps the "50 cm 60 cm" size fragments of a title in one line
const keepSizesTogether = (title: string) =>
  title.replace(
    /(\d+(?:[.,]\d+)?(?:\/\d+(?:[.,]\d+)?)?\s*cm\s+\d+(?:[.,]\d+)?(?:\/\d+(?:[.,]\d+)?)?\s*cm)/gi,
    '<span style="display:inline-block;">$1</span>',
  );

const singleColumnRow = (row: FreebieRow, isLast: boolean, style: FreebieStyle) => {
  const border = isLast ? '' : ` style="border-bottom: 1px solid ${style.line};"`;
  const title = keepSizesTogether(row.title);

  return `
  <tr>
    <td width="96" valign="middle" align="center" class="${isLast ? 'freebieImageTdLast' : 'freebieImageTd'}"${border}>
      <a href="${style.href}" target="_blank"><img src="${row.src}" alt="${row.title}" width="96" height="96" class="freebieImage" /></a>
    </td>
    <td valign="middle" align="left" class="${isLast ? 'freebieTitleTdLast' : 'freebieTitleTd'}"${border}>
      <a href="${style.href}" target="_blank" style="text-decoration: none; color: ${style.text};">
        <span class="newsletterProductTitleFreebie" style="color: ${style.text};">${title}</span>
      </a>
      <!--[if !mso]><!-->
      <div class="freebiePriceMobile">
        ${row.oldPrice ? `<span class="freebieOldPriceMobile" style="color: ${style.text};">${row.oldPrice}</span>` : ''}
        <span class="freebieLowPriceMobile" style="color: ${style.free};">${style.freeText}</span>
      </div>
      <!--<![endif]-->
    </td>
    <td valign="middle" align="right" class="${isLast ? 'freebiePriceDesktopTdLast' : 'freebiePriceDesktopTd'}"${border}>
      ${row.oldPrice ? `<div class="freebieOldPriceDesktop" style="color: ${style.text};">${row.oldPrice}</div>` : ''}
      <div class="freebieLowPriceDesktop" style="color: ${style.free};">${style.freeText}</div>
    </td>
  </tr>`;
};

const twoColumnCells = (row: FreebieRow | null, isLast: boolean, style: FreebieStyle) => {
  const imgClass = isLast ? 'freebieImgTd2colLast' : 'freebieImgTd2col';
  const titleClass = isLast ? 'freebieTitleTd2colLast' : 'freebieTitleTd2col';
  const priceClass = isLast ? 'frebiePriceTd2colLast' : 'frebiePriceTd2col';
  const border = isLast ? '' : ` style="border-bottom: 1px solid ${style.line};"`;

  if (!row) return `<td class="${imgClass}"></td><td class="${titleClass}"></td><td class="${priceClass}"></td>`;

  const title = keepSizesTogether(row.title);

  return `
    <td width="96" valign="middle" align="center" class="${imgClass}"${border}>
      <a href="${style.href}" target="_blank"><img src="${row.src}" alt="${row.title}" width="96" height="96" class="freebieImage" /></a>
      <!--[if !mso]><!-->
      <div class="freebieTileMobile">
        <a href="${style.href}" target="_blank" style="text-decoration: none; color: ${style.text};">
          <span class="newsletterProductTitleFreebie freebieTileMobileTitle" style="color: ${style.text};">${title}</span>
        </a>
        <div class="freebieTileMobilePrice">
          ${row.oldPrice ? `<div class="freebieOldPriceMobile" style="color: ${style.text};">${row.oldPrice}</div>` : ''}
          <div class="freebieLowPriceMobile" style="color: ${style.free};">${style.freeText}</div>
        </div>
      </div>
      <!--<![endif]-->
    </td>
    <td valign="middle" align="left" class="${titleClass}"${border}>
      <a href="${style.href}" target="_blank" style="text-decoration: none; color: ${style.text};">
        <span class="newsletterProductTitleFreebie newsletterProductTitleFreebie2col" style="color: ${style.text};">${title}</span>
      </a>
      <!--[if !mso]><!-->
      <div class="freebiePriceMobile">
        ${row.oldPrice ? `<span class="freebieOldPriceMobile" style="color: ${style.text};">${row.oldPrice}</span>` : ''}
        <span class="freebieLowPriceMobile" style="color: ${style.free};">${style.freeText}</span>
      </div>
      <!--<![endif]-->
    </td>
    <td valign="middle" align="right" class="${priceClass}"${border}>
      ${row.oldPrice ? `<div class="freebieOldPriceDesktop" style="color: ${style.text};">${row.oldPrice}</div>` : ''}
      <div class="freebieLowPriceDesktop" style="color: ${style.free};">${style.freeText}</div>
    </td>`;
};

const renderFreebiesList = (items: FreebieItem[], columns: 1 | 2, options: TimerRenderOptions): string => {
  const theme = getTheme(options.config.themeId);
  const rows = items.map(item => getFreebieRow(item, options)).filter((row): row is FreebieRow => row !== null);
  if (rows.length === 0) return '';

  const style: FreebieStyle = {
    text: theme.freebiesTextColor,
    free: theme.freebiesFreeColor,
    line: theme.freebiesLineColor,
    freeText: escapeHtml(options.phrase('Free') ?? options.phrase('FREE') ?? 'FREE'),
    href: options.href,
  };

  let body = '';
  if (columns === 2) {
    for (let index = 0; index < rows.length; index += 2) {
      const isLast = index + 2 >= rows.length;
      body += `
  <tr>
    ${twoColumnCells(rows[index] ?? null, isLast, style)}
    <td class="freebieGapTd2col"></td>
    ${twoColumnCells(rows[index + 1] ?? null, isLast, style)}
  </tr>`;
    }
  } else {
    body = rows.map((row, index) => singleColumnRow(row, index === rows.length - 1, style)).join('');
  }

  const title = options.phrase('Your free gifts');

  return `
<tr>
  <td class="freebiesContainer freebiesContainer--list" style="background-color: ${theme.freebiesBackground};">
    <table cellspacing="0" cellpadding="0" border="0" width="100%">
      ${
        title
          ? `<tr><td colspan="${columns === 2 ? 7 : 3}" align="left" class="newsletterBottom10px"><span class="newsletterFreebiesTitle" style="color: ${theme.freebiesTextColor}; font-family: 'Open Sans', sans-serif; font-size: 20px; line-height: 1.2; font-weight: 400;">${escapeHtml(title)}</span></td></tr>`
          : ''
      }
      ${body}
    </table>
  </td>
</tr>`;
};

export const buildTimerImageUrl = (config: TimerConfig, slug: string) => {
  const theme = getTheme(config.themeId);
  const urls = generateProloUrls(config.deadline, theme.unitBackground, theme.color, theme.background);
  return urls[SHOP_SLUGS.indexOf(slug)] ?? urls[0] ?? '';
};

export const renderTimerRows = (options: TimerRenderOptions): string => {
  const { config, slug, href } = options;
  const theme = getTheme(config.themeId);
  const background = theme.background;

  const freebies = config.freebies;
  const hasList = freebies.kind === 'list' && freebies.items.length > 0;
  const cta = hasList ? options.phrase('See more') : null;

  let imageFreebie = '';
  if (freebies.kind === 'image' && freebies.src.trim()) {
    const date = freebies.src.trim();
    const file = freebies.insertSlug ? `${slug}${date}` : date;
    imageFreebie = `
<tr>
  <td align="center" style="background-color: ${background};">
    <a href="${href}"><img alt="Freebies picture" loading="lazy" src="https://pictureserver.net/static/${date.slice(0, 4)}/${file}free.png" style="vertical-align: middle; max-width: 100%" /></a>
  </td>
</tr>`;
  }

  const headerTexts = config.header?.texts?.[slug];
  const headerLine = (text: string) =>
    text
      ? `<tr><td align="center" class="newsletterContainer" style="background-color: ${background};"><span class="newsletterSubtitleTimer" style="color: ${theme.color};">${escapeHtml(text).replace(/\n/g, '<br />')}</span></td></tr>`
      : '';
  const header = headerTexts
    ? `${headerLine(headerTexts.title)}${headerLine(headerTexts.subtitle)}${spacer(background)}`
    : '';

  return `
${spacer(background)}
${header}
<tr>
  <td class="newsletterContainer60px" align="center" style="background-color: ${background};">
    <a href="${href}"><img alt="Timer" loading="lazy" src="${buildTimerImageUrl(config, slug)}" style="vertical-align: middle; max-width: 100%" /></a>
  </td>
</tr>
${spacer(background)}
${
  cta
    ? `<tr><td align="center" style="background-color: ${background};"><a href="${href}" class="newsletterFreebieCta" style="color: ${theme.color}; font-size: 20px; line-height: 1.2; text-decoration: underline;">${escapeHtml(cta)}</a></td></tr>${spacer(background)}`
    : ''
}
${imageFreebie}
${freebies.kind === 'list' ? renderFreebiesList(freebies.items, freebies.columns, options) : ''}`;
};
