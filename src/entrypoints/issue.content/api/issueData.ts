import axios from 'axios';
import type { IssueListItem, IssueListResponse, SpreadsheetTranslations } from '../lib/types';
import { SHOP_ALIASES } from '../lib/shopConfig';
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

const ZROK_BASE = 'https://plgost2ibovu.share.zrok.io';
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
