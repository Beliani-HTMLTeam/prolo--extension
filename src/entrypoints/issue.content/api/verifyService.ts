import axios from 'axios';
import pLimit from 'p-limit';
import { config } from '@/config/prolo';
import { SHOP_ID_MAP } from '../lib/shopConfig';
import { SLUG_ID_MAP } from '@/entrypoints/issue.content/lib/planningConfig';
import { LANG_TO_SLUG } from '../utils/updater/constants';
import { normalizeSlugForSlug } from '../utils/planning/slugNormalization';
 
// Limits concurrent HTTP requests (not slugs), so an A/B issue (up to 4 pages per slug)
// never sends more than this many requests to Prologistics at once.
const limit = pLimit(6);
 
const NOT_FOUND = 'TRANSLATION NOT FOUND';
 
export type Variant = 'a' | 'b';
 
export interface VariantVerification {
  variant: Variant;
  nsltId: string;
  lpId: string;
  actualSubject: string | null;
  actualPageTitle: string | null;
  subjectNeedsUpdate: boolean;
  pageTitleNeedsUpdate: boolean;
  error?: string;
}
 
export interface VerificationResult {
  slug: string;
  /** Group A ids (or B when there is no A) - kept for backwards compatibility */
  nsltId: string;
  lpId: string;
  spreadsheetSubject: string | null;
  spreadsheetPageTitle: string | null;
  /** Values of the first checked variant (A) - kept for backwards compatibility */
  actualSubject: string | null;
  actualPageTitle: string | null;
  /** true when ANY variant (A or B) needs an update */
  subjectNeedsUpdate: boolean;
  pageTitleNeedsUpdate: boolean;
  isABTest: boolean;
  variants: Partial<Record<Variant, VariantVerification>>;
  error?: string;
}
 
export interface VerifyItem {
  slug: string;
  spreadsheetSubject: string | null;
  spreadsheetPageTitle: string | null;
  /** Group A newsletter / LP (or the only one for a regular, non-A/B issue) */
  nsltId?: string;
  lpId?: string;
  /** Group B newsletter / LP (A/B tests only) */
  nsltBId?: string;
  lpBId?: string;
}
 
// Fallback only - LANG_TO_SLUG is the source of truth, because the updater writes title[<LANG_TO_SLUG>]
const FALLBACK_LANG: Record<string, string> = {
  CHFR: 'french',
  CHDE: 'german',
  CHIT: 'italian',
  BEFR: 'french',
  BENL: 'dutch',
  FR: 'french',
  HR: "croatian",
  DE: 'german',
  AT: 'germanDE',
  NL: 'dutch',
  ES: 'spanish',
  PT: 'portugal',
  IT: 'italian',
  DK: 'danish',
  NO: 'norsk',
  FI: 'finnish',
  SE: 'swedish',
  CZ: 'czech',
  SI: "slovene",
  SK: 'slovak',
  HU: 'Hungarian',
  PL: 'polish',
  RO: 'romanian',
  UK: 'english',
};
 
const getLanguageForSlug = (slug: string): string | null =>
  (LANG_TO_SLUG as Record<string, string>)[slug] || FALLBACK_LANG[slug] || null;
 
// Same shop id lookup as the updater, so verify reads the exact page the updater writes
const getShopIdForSlug = (slug: string): string | null => {
  const slugIdMap = SLUG_ID_MAP as Record<string, string | number>;
  const shopIdMap = SHOP_ID_MAP as Record<string, string | number>;
  const id = slugIdMap[slug] ?? slugIdMap[normalizeSlugForSlug(slug)] ?? shopIdMap[slug];
  return id !== undefined && id !== null ? String(id) : null;
};
 
// ---------- text helpers ----------
 
const decodeHtmlEntities = (text: string): string => {
  if (!/&(#\d+|#x[\da-f]+|[a-z]+);/i.test(text)) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};
 
// Unicode-aware and case-sensitive: the old version dropped every non a-z character
// (ą, ž, ø, ö, emojis, %...) so many real differences were reported as "OK".
const normalizeText = (text: string): string =>
  decodeHtmlEntities(text)
    .replace(/<[^>]*>/g, '')
    .normalize('NFC')
    .replace(/[​-‍⁠﻿️]/g, '') // zero-width chars / emoji variation selector
    .replace(/[\s ]+/g, ' ')
    .trim();
 
const cleanExpected = (value: string | null): string | null =>
  value && value.trim() && value !== NOT_FOUND ? value : null;
 
const needsUpdate = (checked: boolean, actual: string | null, expected: string | null): boolean => {
  if (!checked || expected === null) return false; // nothing to compare against
  if (actual === null) return true; // page / field could not be read
  return normalizeText(actual) !== normalizeText(expected);
};
 
// ---------- fetching / parsing ----------
 
type PageCache = Map<string, Promise<Document>>;
 
// Each page is fetched once per verify run (shared LPs/newsletters, A === B ids, etc.)
const fetchDocument = (url: string, cache: PageCache): Promise<Document> => {
  let pending = cache.get(url);
  if (!pending) {
    pending = limit(() => axios.get<string>(url, { withCredentials: true, responseType: 'text' })).then(res =>
      new DOMParser().parseFromString(String(res.data), 'text/html'),
    );
    cache.set(url, pending);
  }
  return pending;
};
 
const readField = (doc: Document, name: string): string | null => {
  const el = doc.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name.replace(/"/g, '\\"')}"]`);
  if (!el) return null;
  return el instanceof HTMLTextAreaElement ? el.textContent ?? '' : el.getAttribute('value') ?? '';
};
 
const readPageTitle = (doc: Document, lang: string | null, strict = false): string | null => {
  if (lang) {
    const value = readField(doc, `title[${lang}]`);
    // field exists -> use it, even when empty (the old code then fell back to another language's title)
    if (value !== null) return value;
  }
  // strict (used when writing back): never take another language's title
  if (strict) return null;
  // language unknown / field missing: first non-empty title of any language
  const fields = doc.querySelectorAll<HTMLInputElement>('input[name^="title["]');
  for (const field of Array.from(fields)) {
    const value = field.getAttribute('value') ?? '';
    if (value.trim()) return value;
  }
  return null;
};
 
const fetchSubject = async (nsltId: string, cache: PageCache): Promise<string> => {
  const doc = await fetchDocument(`${window.location.origin}${config.paths.newsEmail}?id=${nsltId}`, cache);
  const subject = readField(doc, 'subject');
  if (subject === null) throw new Error(`Subject field not found in newsletter ${nsltId} (session expired?)`);
  return subject;
};
 
const fetchPageTitle = async (lpId: string, slug: string, cache: PageCache, strict = false): Promise<string> => {
  const shopId = getShopIdForSlug(slug);
  if (!shopId) throw new Error(`No shop id for ${slug}`);
 
  const doc = await fetchDocument(
    `${window.location.origin}${config.paths.shopContent}?id=${lpId}&shop_id=${shopId}`,
    cache,
  );
  const title = readPageTitle(doc, getLanguageForSlug(slug), strict);
  if (title === null) throw new Error(`Page title field not found in LP ${lpId} (session expired?)`);
  return title;
};
 
// ---------- current values (used by the updater to keep what is already in Prologistics) ----------
 
export const createPageCache = (): PageCache => new Map();
 
/** Current subject of a newsletter, as saved in Prologistics */
export const fetchCurrentSubject = (nsltId: string, cache: PageCache = createPageCache()) =>
  fetchSubject(nsltId, cache);
 
/** Current page title of an LP in the shop's own language only (never another language) */
export const fetchCurrentPageTitle = (lpId: string, slug: string, cache: PageCache = createPageCache()) =>
  fetchPageTitle(lpId, slug, cache, true);
 
// ---------- verification ----------
 
const verifyVariant = async (
  variant: Variant,
  nsltId: string,
  lpId: string,
  slug: string,
  expectedSubject: string | null,
  expectedPageTitle: string | null,
  cache: PageCache,
): Promise<VariantVerification> => {
  const errors: string[] = [];
  const checkSubject = !!nsltId && expectedSubject !== null;
  const checkTitle = !!lpId && expectedPageTitle !== null;
 
  // newsletter + LP fetched in parallel; one failing doesn't hide the other
  const [actualSubject, actualPageTitle] = await Promise.all([
    checkSubject
      ? fetchSubject(nsltId, cache).catch((e: Error) => (errors.push(`NSLT: ${e.message}`), null))
      : Promise.resolve(null),
    checkTitle
      ? fetchPageTitle(lpId, slug, cache).catch((e: Error) => (errors.push(`LP: ${e.message}`), null))
      : Promise.resolve(null),
  ]);
 
  return {
    variant,
    nsltId,
    lpId,
    actualSubject,
    actualPageTitle,
    subjectNeedsUpdate: needsUpdate(checkSubject, actualSubject, expectedSubject),
    pageTitleNeedsUpdate: needsUpdate(checkTitle, actualPageTitle, expectedPageTitle),
    ...(errors.length > 0 && { error: errors.join(' | ') }),
  };
};
 
const verifySlug = async (item: VerifyItem, cache: PageCache): Promise<VerificationResult> => {
  const expectedSubject = cleanExpected(item.spreadsheetSubject);
  const expectedPageTitle = cleanExpected(item.spreadsheetPageTitle);
 
  const nsltA = item.nsltId || '';
  const lpA = item.lpId || '';
  const nsltB = item.nsltBId || '';
  const lpB = item.lpBId || '';
 
  const hasA = !!(nsltA || lpA);
  // B only counts when it points to something different from A
  const hasB = !!(nsltB || lpB) && (nsltB !== nsltA || lpB !== lpA);
 
  const [a, b] = await Promise.all([
    hasA ? verifyVariant('a', nsltA, lpA, item.slug, expectedSubject, expectedPageTitle, cache) : null,
    hasB ? verifyVariant('b', nsltB, lpB, item.slug, expectedSubject, expectedPageTitle, cache) : null,
  ]);
 
  const checked = [a, b].filter((v): v is VariantVerification => v !== null);
  const primary = checked[0];
  const errors = checked.filter(v => v.error).map(v => (hasA && hasB ? `${v.variant.toUpperCase()}: ${v.error}` : v.error!));
 
  return {
    slug: item.slug,
    nsltId: primary?.nsltId || '',
    lpId: primary?.lpId || '',
    spreadsheetSubject: item.spreadsheetSubject,
    spreadsheetPageTitle: item.spreadsheetPageTitle,
    actualSubject: primary?.actualSubject ?? null,
    actualPageTitle: primary?.actualPageTitle ?? null,
    subjectNeedsUpdate: checked.some(v => v.subjectNeedsUpdate),
    pageTitleNeedsUpdate: checked.some(v => v.pageTitleNeedsUpdate),
    isABTest: hasA && hasB,
    variants: { ...(a && { a }), ...(b && { b }) },
    ...(errors.length > 0 && { error: errors.join(' || ') }),
  };
};
 
// Export the batch verification function (requests limited with p-limit)
export const verifyBatch = async (
  items: VerifyItem[],
  onProgress?: (completed: number, total: number, result: VerificationResult) => void,
): Promise<VerificationResult[]> => {
  const cache: PageCache = new Map();
  const total = items.length;
  let completed = 0;
 
  return Promise.all(
    items.map(async item => {
      const result = await verifySlug(item, cache);
      completed++;
      onProgress?.(completed, total, result);
      return result;
    }),
  );
};
 