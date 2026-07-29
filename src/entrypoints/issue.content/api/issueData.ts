import axios from 'axios';
import type { IssueListItem, IssueListResponse, LineTitleTranslations, SpreadsheetTranslations } from '../lib/types';
import { SHOP_ALIASES } from '../lib/shopConfig';
import { trimAllLineBreaks } from '../utils/updater/stringUtils';
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

const SUNDAY_SPREADSHEET_ID = '1RcsQspit0B3b3xX1NwZ9RWnUzZrkoVDULu2cnPMZ04U'
const SUNDAY_GID = '1224674314';

export const fetchAllSundayTranslations = async (
  issueItem: IssueListItem
): Promise<SundayTranslationsResult | null> => {
   try {
    const sundayField = issueItem.additional_fields?.['Sunday newsletter']
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

    const subjectLineIndices = [2,3,4,5,6,7];

    const subjectLine: Record<number, Record<string, string>> = {};

    subjectLineIndices.forEach((_, idx) => {
      subjectLine[idx] = {};
    })

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

    return {subjectLines: subjectLine}
  } catch (e) {
    console.warn('[spreadsheet] Failed to fetch translations:', e);
    return null;
  }
}