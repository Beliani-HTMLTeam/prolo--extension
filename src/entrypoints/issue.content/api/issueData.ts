import axios from 'axios';
import type {
  IssueListItem,
  IssueListResponse,
  LineTitleTranslations,
  PushTranslations,
  SpreadsheetTranslations,
} from '../lib/types';
import { SHOP_ALIASES } from '../lib/shopConfig';
import { trimAllLineBreaks } from '../utils/updater/stringUtils';
import { SLUG_ORDER } from '@/entrypoints/push.content/helpers/slugMapper';
export { extractIssueLinks } from './issueLinks';
export { parseIssueInfo, getChecklistMode } from './issueParsing';
export { fetchMentionableUsers } from './mentions';

export const fetchIssueData = async (issueId: number) => {
  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/issueLog/list/?page_id=${issueId}&show_with_inactive=1`;

  try {
    const { data } = await axios.get(apiUrl);
    return data as IssueListResponse;
  } catch (error) {
    console.error('Failed to fetch issue data:', error);
    throw error;
  }
};

const ZROK_BASE = 'https://tj31c889tzsk.share.zrok.io/api/sheets';
const ZROK_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  skip_zrok_interstitial: 'true',
};
const ZROK_TIMEOUT_MS = 6000;

const SLUG_CANONICAL_ALIAS: Record<string, string> = SHOP_ALIASES;

const withZrokTimeout = <T>(p: Promise<T>): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rj) => setTimeout(() => rj(new Error('zrok timeout')), ZROK_TIMEOUT_MS))]);

const withLongTimeout = <T>(p: Promise<T>, timeoutMs: number = 30000): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, rj) => setTimeout(() => rj(new Error('zrok timeout after ' + timeoutMs + 'ms')), timeoutMs)),
  ]);

const withRetry = async <T>(fn: () => Promise<T>, maxRetries: number = 3, delayMs: number = 2000): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries - 1) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('All retries failed');
};

export const fetchSpreadsheetTranslations = async (issueItem: IssueListItem): Promise<SpreadsheetTranslations> => {
  const empty: SpreadsheetTranslations = { timer: null, push: null };
  try {
    const nsltFields = issueItem.additional_fields?.['Newsletter production'];
    const spreadsheetField = nsltFields?.find(f => f.name === 'Translation spreadsheet newsletter');
    if (!spreadsheetField?.value) return empty;

    const url = spreadsheetField.value;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const queryGidMatch = url.match(/[?&]gid=([^&#]+)/);
    const hashGidMatch = url.match(/#gid=([^&]+)/);
    const spreadsheetId = idMatch?.[1];
    const gid = queryGidMatch?.[1] ?? hashGidMatch?.[1];
    if (!spreadsheetId || !gid) return empty;

    const tabRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/misc/resolveTabName/${spreadsheetId}/${gid}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const tabJson = await tabRes.json();
    console.log('tabJson', tabJson);
    if (tabJson?.code !== 200) return empty;

    const dynRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/dynamic/${tabJson.year}/${tabJson.tab}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const dynJson = await dynRes.json();
    if (dynJson?.code !== 200) return empty;

    const data: Record<string, string[]> = dynJson.data ?? {};
    console.log('data', dynJson);
    const timer: Record<string, boolean> = {};
    const push: Record<string, boolean> = {};
    let hasTimerEntries = false;
    let hasPushEntries = false;

    for (const [rawCountry, countryData] of Object.entries(data)) {
      const country = SLUG_CANONICAL_ALIAS[rawCountry.toUpperCase()] ?? rawCountry;
      for (const v of countryData) {
        if (typeof v === 'string' && v.startsWith('Timer')) {
          timer[country] = v === 'Timer Translation Done!' || v === 'Timer Translation Done';
          hasTimerEntries = true;
          break;
        }
      }
      for (const v of countryData) {
        if (typeof v === 'string' && v.startsWith('PUSH')) {
          push[country] = v === 'PUSH Translation Done!' || v === 'PUSH Translation Done';
          hasPushEntries = true;
          break;
        }
      }
    }

    return {
      timer: hasTimerEntries ? timer : null,
      push: hasPushEntries ? push : null,
    };
  } catch (e) {
    console.warn('[spreadsheet] Failed to fetch translations:', e);
    return empty;
  }
};

export const fetchSubjectPageTranslations = async (issueItem: IssueListItem): Promise<LineTitleTranslations> => {
  const empty: LineTitleTranslations = { subjectLine: null, pageTitle: null };
  try {
    const nsltFields = issueItem.additional_fields?.['Newsletter production'];
    const spreadsheetField = nsltFields?.find(f => f.name === 'Translation spreadsheet newsletter');
    if (!spreadsheetField?.value) return empty;

    const url = spreadsheetField.value;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const queryGidMatch = url.match(/[?&]gid=([^&#]+)/);
    const hashGidMatch = url.match(/#gid=([^&]+)/);
    const spreadsheetId = idMatch?.[1];
    const gid = queryGidMatch?.[1] ?? hashGidMatch?.[1];
    if (!spreadsheetId || !gid) return empty;

    const tabRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/misc/resolveTabName/${spreadsheetId}/${gid}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const tabJson = await tabRes.json();
    if (tabJson?.code !== 200) return empty;

    const dynRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/dynamic/${tabJson.year}/${tabJson.tab}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const dynJson = await dynRes.json();
    if (dynJson?.code !== 200) return empty;

    const data: Record<string, string[]> = dynJson.data ?? {};
    const keys: string[] = dynJson.keys ?? [];

    const subjectLineIndex = keys.findIndex(k => k.toLowerCase().includes('subject line'));
    const pageTitleIndex = keys.findIndex(k => k.toLowerCase().includes('page title'));

    const subjectLine: Record<string, string> = {};
    const pageTitle: Record<string, string> = {};

    for (const [rawCountry, countryData] of Object.entries(data)) {
      const country = SLUG_CANONICAL_ALIAS[rawCountry.toUpperCase()] ?? rawCountry;

      if (subjectLineIndex !== -1 && countryData[subjectLineIndex]) {
        const subjectLineValue = countryData[subjectLineIndex];
        if (subjectLineValue && typeof subjectLineValue === 'string' && subjectLineValue.trim()) {
          subjectLine[country] = trimAllLineBreaks(subjectLineValue.trim());
        } else {
          subjectLine[country] = 'TRANSLATION NOT FOUND';
        }
      } else {
        subjectLine[country] = 'TRANSLATION NOT FOUND';
      }

      if (pageTitleIndex !== -1 && countryData[pageTitleIndex]) {
        const pageTitleValue = countryData[pageTitleIndex];
        if (pageTitleValue && typeof pageTitleValue === 'string' && pageTitleValue.trim()) {
          pageTitle[country] = trimAllLineBreaks(pageTitleValue.trim());
        } else {
          pageTitle[country] = 'TRANSLATION NOT FOUND';
        }
      } else {
        pageTitle[country] = 'TRANSLATION NOT FOUND';
      }
    }

    return {
      subjectLine: Object.keys(subjectLine).length > 0 ? subjectLine : null,
      pageTitle: Object.keys(pageTitle).length > 0 ? pageTitle : null,
    };
  } catch (e) {
    console.warn('[spreadsheet] Failed to fetch translations:', e);
    return empty;
  }
};

export const fetchCachedTabs = async (year: string): Promise<{ tabs: string[] | null }> => {
  const empty: { tabs: string[] | null } = { tabs: null };
  try {
    const tabsRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/misc/getCachedTabs/${year}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const tabJson = await tabsRes.json();
    if (tabJson?.code !== 200) return empty;

    const tabs = tabJson.tabs ?? [];

    return {
      tabs: tabs.length > 0 ? tabs : null,
    };
  } catch (e) {
    console.warn('[spreadsheet] Failed to fetch translations:', e);
    return empty;
  }
};

export const fetchPushTranslations = async (
  spreadsheetUrl: string,
  year: string,
  tabName: string,
): Promise<PushTranslations> => {
  const empty: PushTranslations = { pushTitles: null, pushMessages: null };
  try {
    const url = spreadsheetUrl;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const queryGidMatch = url.match(/[?&]gid=([^&#]+)/);
    const hashGidMatch = url.match(/#gid=([^&]+)/);
    const spreadsheetId = idMatch?.[1];
    const gid = queryGidMatch?.[1] ?? hashGidMatch?.[1];
    if (!spreadsheetId || !gid) return empty;

    // Fetch tab info
    const tabRes = await withRetry(() =>
      withLongTimeout(
        fetch(`${ZROK_BASE}/misc/resolveTabName/${spreadsheetId}/${gid}`, {
          headers: ZROK_HEADERS,
          mode: 'cors',
          credentials: 'omit',
        }),
      ),
    );
    const tabJson = await tabRes.json();
    if (tabJson?.code !== 200) return empty;

    // Fetch dynamic sheet data
    console.log(`📊 Fetching dynamic sheet for: ${year}/${tabName}`);
    const dynRes = await withRetry(() =>
      withLongTimeout(
        fetch(`${ZROK_BASE}/dynamic/${year}/${tabName}`, {
          headers: ZROK_HEADERS,
          mode: 'cors',
          credentials: 'omit',
        }),
        30000, // 30 second timeout
      ),
    );
    const dynJson = await dynRes.json();
    if (dynJson?.code !== 200) {
      console.warn(`⚠️ Dynamic sheet returned code ${dynJson?.code} for ${tabName}`);
      return empty;
    }

    const data: Record<string, string[]> = dynJson.data ?? {};
    const keys: string[] = dynJson.keys ?? [];

    console.log(`📋 Found ${Object.keys(data).length} countries, ${keys.length} columns`);
    console.log(`📋 Column keys:`, keys);

    // Find PUSH title and message columns with exact matching
    let pushTitleIndex = -1;
    let pushMessageIndex = -1;

    // First try exact match
    keys.forEach((key, index) => {
      const normalizedKey = key?.trim().toLowerCase() || '';
      if (normalizedKey === 'push title') {
        pushTitleIndex = index;
      }
      if (normalizedKey === 'push message') {
        pushMessageIndex = index;
      }
    });

    // If exact match not found, try partial match
    if (pushTitleIndex === -1) {
      pushTitleIndex = keys.findIndex(
        k => k?.toLowerCase().includes('push title') || k?.toLowerCase().includes('pushtitle'),
      );
    }
    if (pushMessageIndex === -1) {
      pushMessageIndex = keys.findIndex(
        k => k?.toLowerCase().includes('push message') || k?.toLowerCase().includes('pushmessage'),
      );
    }

    console.log(`📍 PUSH Title column index: ${pushTitleIndex}, PUSH Message column index: ${pushMessageIndex}`);

    const pushTitles: Record<string, string> = {};
    const pushMessages: Record<string, string> = {};

    for (const [rawCountry, countryData] of Object.entries(data)) {
      // Map country aliases
      let country = rawCountry.toUpperCase();
      // Handle special cases
      if (country === 'CHDE') country = 'CHDE';
      else if (country === 'CHFR') country = 'CHFR';
      else if (country === 'BEFR') country = 'BEFR';
      else if (country === 'BENL') country = 'BENL';
      else if (country === 'CHIT') country = 'CHIT';
      else if (country === 'UK') country = 'UK';
      else if (country === 'DE') country = 'DE';
      else if (country === 'AT') country = 'AT';
      else if (country === 'FR') country = 'FR';
      else if (country === 'ES') country = 'ES';
      else if (country === 'IT') country = 'IT';
      else if (country === 'PL') country = 'PL';
      else if (country === 'NL') country = 'NL';
      else if (country === 'PT') country = 'PT';
      else if (country === 'SE') country = 'SE';
      else if (country === 'NO') country = 'NO';
      else if (country === 'DK') country = 'DK';
      else if (country === 'FI') country = 'FI';
      else if (country === 'CZ') country = 'CZ';
      else if (country === 'SK') country = 'SK';
      else if (country === 'HU') country = 'HU';
      else if (country === 'RO') country = 'RO';
      else if (country === 'HR') country = 'HR';
      else if (country === 'SI') country = 'SI';

      // Skip if country not in our slug list
      if (!SLUG_ORDER.includes(country)) continue;

      // Get title
      if (pushTitleIndex !== -1 && countryData[pushTitleIndex]) {
        const value = countryData[pushTitleIndex];
        if (value && typeof value === 'string' && value.trim()) {
          pushTitles[country] = trimAllLineBreaks(value.trim());
        } else {
          pushTitles[country] = 'TRANSLATION NOT FOUND';
        }
      } else {
        pushTitles[country] = 'TRANSLATION NOT FOUND';
      }

      // Get message
      if (pushMessageIndex !== -1 && countryData[pushMessageIndex]) {
        const value = countryData[pushMessageIndex];
        if (value && typeof value === 'string' && value.trim()) {
          pushMessages[country] = trimAllLineBreaks(value.trim());
        } else {
          pushMessages[country] = 'TRANSLATION NOT FOUND';
        }
      } else {
        pushMessages[country] = 'TRANSLATION NOT FOUND';
      }
    }

    console.log(`✅ Found ${Object.keys(pushTitles).length} titles, ${Object.keys(pushMessages).length} messages`);

    return {
      pushTitles: Object.keys(pushTitles).length > 0 ? pushTitles : null,
      pushMessages: Object.keys(pushMessages).length > 0 ? pushMessages : null,
    };
  } catch (e) {
    console.warn('[spreadsheet] Failed to fetch translations:', e);
    return empty;
  }
};

export const fetchSpreadsheetTranslationsTab = async (issueItem: IssueListItem): Promise<string | null> => {
  try {
    const nsltFields = issueItem.additional_fields?.['Newsletter production'];
    const spreadsheetField = nsltFields?.find(f => f.name === 'Translation spreadsheet newsletter');
    if (!spreadsheetField?.value) return null;

    const url = spreadsheetField.value;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const queryGidMatch = url.match(/[?&]gid=([^&#]+)/);
    const hashGidMatch = url.match(/#gid=([^&]+)/);
    const spreadsheetId = idMatch?.[1];
    const gid = queryGidMatch?.[1] ?? hashGidMatch?.[1];
    if (!spreadsheetId || !gid) return null;

    const tabRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/misc/resolveTabName/${spreadsheetId}/${gid}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const tabJson = await tabRes.json();
    if (tabJson?.code !== 200) return null;

    return tabJson.tab || null;
  } catch (e) {
    console.warn('[spreadsheet] Failed to fetch translations:', e);
    return null;
  }
};

export interface SundayTranslationsResult {
  subjectLines: Record<number, Record<string, string>>;
}

const SUNDAY_SPREADSHEET_ID = '1RcsQspit0B3b3xX1NwZ9RWnUzZrkoVDULu2cnPMZ04U';
const SUNDAY_GID = '2042078338';

export const fetchAllSundayTranslations = async (
  issueItem: IssueListItem,
): Promise<SundayTranslationsResult | null> => {
  try {
    const sundayField = issueItem.additional_fields?.['Sunday newsletter'];
    if (!sundayField) return null;

    const spreadsheetId = SUNDAY_SPREADSHEET_ID;
    const gid = SUNDAY_GID;

    const tabRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/misc/resolveTabName/${spreadsheetId}/${gid}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const tabJson = await tabRes.json();
    if (tabJson?.code !== 200) return null;

    const dynRes = await withZrokTimeout(
      fetch(`${ZROK_BASE}/dynamic/${tabJson.year}/${tabJson.tab}`, {
        headers: ZROK_HEADERS,
        mode: 'cors',
        credentials: 'omit',
      }),
    );
    const dynJson = await dynRes.json();
    if (dynJson?.code !== 200) return null;

    const data: Record<string, string[]> = dynJson.data ?? {};

    const subjectLineIndices = [4, 5, 6, 7, 8, 9];

    const subjectLine: Record<number, Record<string, string>> = {};

    subjectLineIndices.forEach((_, idx) => {
      subjectLine[idx] = {};
    });

    for (const [rawCountry, countryData] of Object.entries(data)) {
      const country = SLUG_CANONICAL_ALIAS[rawCountry.toUpperCase()] ?? rawCountry;

      subjectLineIndices.forEach((dataIndex, optionIndex) => {
        const value = countryData[dataIndex];
        if (value && typeof value === 'string' && value.trim()) {
          subjectLine[optionIndex][country] = trimAllLineBreaks(value.trim());
        } else {
          subjectLine[optionIndex][country] = 'TRANSLATION NOT FOUND';
        }
      });
    }

    return { subjectLines: subjectLine };
  } catch (e) {
    console.warn('[spreadsheet] Failed to fetch translations:', e);
    return null;
  }
};
