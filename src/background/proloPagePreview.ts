import type { ProloPage } from '@/config/linkPreview';
import { decodeEntities, type LinkPreviewResult } from './linkPreview';

const LP_DATE_RE = /\blp(\d{2})-(\d{2})-(\d{2})/i;
const STATUS_RE = /class\s*=\s*["'][^"']*\bbanner_status_(active|inactive)\b/i;
const EDIT_PAGE_TITLE_RE = /<title>\s*Edit (?:content|news|banner) #/i;
const MAX_LISTED_SHOPS = 4;
const STATUS_COLORS = { active: '#6bb700', inactive: '#8a8886' };
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PAGE_LABELS: Record<ProloPage['kind'], string> = {
  shopContent: 'Shop content',
  newsEmail: 'Newsletter',
  shopBanner: 'Banner',
};

export async function fetchProloPagePreview(
  url: string,
  page: ProloPage,
  signal: AbortSignal,
): Promise<LinkPreviewResult> {
  const resp = await fetch(page.fetchUrl, { credentials: 'include', signal, headers: { Accept: 'text/html' } });
  if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };

  const html = await resp.text();
  if (!EDIT_PAGE_TITLE_RE.test(html)) return { ok: false, error: 'not an edit page (not logged in to Prolo?)' };

  const status = html.match(STATUS_RE)?.[1]?.toLowerCase() as keyof typeof STATUS_COLORS | undefined;
  const dates = formatDateRange(inputValue(html, 'activate_from_date'), inputValue(html, 'deactivate_from_date'));
  const shops = formatShops(selectedOptions(html, 'shops[]'));
  const base = {
    ok: true as const,
    url,
    siteName: `Prolo · ${PAGE_LABELS[page.kind]} #${page.id}`,
    accent: status ? STATUS_COLORS[status] : undefined,
  };

  switch (page.kind) {
    case 'shopContent': {
      const name = inputValue(html, 'name');
      const title = inputValueByPrefix(html, 'title[');
      return {
        ...base,
        title: title || name || `Shop content #${page.id}`,
        description: title ? name : undefined,
        details: compact([formatNewsletterDate(name), formatStatus(status), shops, dates]),
      };
    }
    case 'newsEmail': {
      const lpName = selectedOptions(html, 'shop_content_id')[0];
      const lang = selectedOptions(html, 'lang')[0] ?? inputValue(html, 'lang');
      return {
        ...base,
        title: inputValue(html, 'subject') || `Newsletter #${page.id}`,
        description: lpName ? `LP ${lpName}` : undefined,
        details: compact([formatNewsletterDate(lpName), capitalize(lang)]),
      };
    }
    case 'shopBanner': {
      const lpName = selectedOptions(html, 'shop_content_id')[0];
      const category = selectedOptions(html, 'category_url')[0]?.replace(/^\d+:\s*/, '');
      const block = selectedOptions(html, 'block')[0];
      return {
        ...base,
        title: category ? `Banner #${page.id} · ${category}` : `Banner #${page.id}`,
        description: lpName ? `LP ${lpName}` : undefined,
        details: compact([formatStatus(status), dates, block, shops, formatNewsletterDate(lpName)]),
      };
    }
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readAttr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\s${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'))?.[2];
}

function inputValue(html: string, name: string): string | undefined {
  return inputValueMatching(html, escapeRegExp(name));
}

function inputValueByPrefix(html: string, prefix: string): string | undefined {
  return inputValueMatching(html, `${escapeRegExp(prefix)}[^"']*`);
}

function inputValueMatching(html: string, namePattern: string): string | undefined {
  const inputPattern = new RegExp(`<input\\b[^>]*\\sname\\s*=\\s*["']${namePattern}["'][^>]*>`, 'gi');
  for (const [tag] of html.matchAll(inputPattern)) {
    const value = decodeEntities(readAttr(tag, 'value') ?? '').trim();
    if (value) return value;
  }
  return undefined;
}

function selectedOptions(html: string, name: string): string[] {
  const select = html.match(
    new RegExp(`<select\\b[^>]*\\sname\\s*=\\s*["']${escapeRegExp(name)}["'][^>]*>([\\s\\S]*?)</select>`, 'i'),
  )?.[1];
  if (!select) return [];
  return [...select.matchAll(/<option\b([^>]*)>([^<]*)/gi)]
    .filter(([, attrs]) => /\sselected\b/i.test(attrs))
    .map(([, , text]) => decodeEntities(text).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function formatNewsletterDate(text: string | undefined): string | undefined {
  const match = text?.match(LP_DATE_RE);
  if (!match) return undefined;
  const [, yy, mm, dd] = match;
  const date = new Date(Date.UTC(2000 + Number(yy), Number(mm) - 1, Number(dd)));
  if (Number.isNaN(date.getTime())) return undefined;
  return `Newsletter ${WEEKDAYS[date.getUTCDay()]} 20${yy}.${mm}.${dd}`;
}

function formatDateRange(from: string | undefined, to: string | undefined): string | undefined {
  if (!from && !to) return undefined;
  return `${from ?? '…'} → ${to ?? '…'}`;
}

function formatStatus(status: string | undefined): string | undefined {
  return status ? capitalize(status) : undefined;
}

function formatShops(domains: string[]): string | undefined {
  if (!domains.length) return undefined;
  if (domains.length > MAX_LISTED_SHOPS) return `${domains.length} shops`;
  return domains
    .map(domain => {
      const shopSuffix = domain
        .toLowerCase()
        .replace(/^www\./, '')
        .replace(/^beliani\./, '');
      return shopSuffix === 'co.uk' ? 'UK' : shopSuffix.toUpperCase();
    })
    .join(', ');
}

function capitalize(value: string | undefined): string | undefined {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : undefined;
}

function compact(values: (string | undefined)[]): string[] {
  return values.filter((value): value is string => !!value);
}
