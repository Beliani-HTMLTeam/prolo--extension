import { config } from '@/config/prolo';
import { fetchCachedTabs } from '@/entrypoints/issue.content/api/issueData';
import { SHOP_SLUGS } from '../../constants/shops';
import type { TimerHeaderTexts } from '../../types';

type SheetData = Record<string, unknown[]>;

const requestInit = { headers: config.zrokHeaders, mode: 'cors', credentials: 'omit' } as const;

const FIRST_DATA_ROW = 2;

const resolveTab = async (sheet: string): Promise<{ year: string; tab: string }> => {
  const value = sheet.trim();
  const id = value.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];

  if (id) {
    const gid = value.match(/[?#&]gid=(\d+)/)?.[1];
    if (!gid) throw new Error('Sheet link has no gid (open the right tab first)');

    const json = await fetch(`${config.zrokBase}/misc/resolveTabName/${id}/${gid}`, requestInit).then(r => r.json());
    if (json?.code !== 200) throw new Error('Tab of the sheet link was not found');
    return { year: String(json.year), tab: String(json.tab) };
  }

  const [year, ...rest] = value.split('::');
  if (rest.length > 0) return { year: year.trim(), tab: rest.join('::').replace('!', '').trim() };
  return { year: String(new Date().getFullYear()), tab: value.replace('!', '').trim() };
};

const sheets = new Map<string, Promise<SheetData>>();

const loadSheet = async (sheet: string): Promise<SheetData> => {
  const { year, tab } = await resolveTab(sheet);
  const json = await fetch(`${config.zrokBase}/dynamic/${year}/${encodeURIComponent(tab)}`, requestInit).then(r =>
    r.json(),
  );
  if (json?.code !== 200 || !json.data) throw new Error(`Sheet "${year}::${tab}" could not be loaded`);
  return json.data as SheetData;
};

const cell = (rows: unknown[] | undefined, row: number) => {
  const value = rows?.[row - FIRST_DATA_ROW];
  return typeof value === 'string' ? value.replace(/<br\s*\/?>/gi, '\n').trim() : '';
};

export const fetchTimerHeader = async (
  sheet: string,
  titleRow: number,
  subtitleRow: number,
): Promise<Record<string, TimerHeaderTexts>> => {
  const key = sheet.trim();
  let promise = sheets.get(key);
  if (!promise) {
    promise = loadSheet(key);
    promise.catch(() => sheets.delete(key));
    sheets.set(key, promise);
  }
  const data = await promise;

  const byUpperSlug = new Map(Object.entries(data).map(([slug, rows]) => [slug.toUpperCase(), rows]));
  const result: Record<string, TimerHeaderTexts> = {};

  for (const slug of SHOP_SLUGS) {
    const upper = slug.toUpperCase();
    const rows = byUpperSlug.get(upper) ?? (upper === 'ES' ? byUpperSlug.get('SP') : undefined);
    const title = cell(rows, titleRow);
    const subtitle = cell(rows, subtitleRow);
    if (title || subtitle) result[slug] = { title, subtitle };
  }

  return result;
};

const tabDate = (name: string): Date | null => {
  const match = name.match(/\b(\d{2})\.(\d{2})\.(\d{4}|\d{2})\b/);
  if (!match) return null;
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  return new Date(year, Number(match[2]) - 1, Number(match[1]));
};

export const fetchRecentTabs = async (): Promise<string[]> => {
  const { tabs } = await fetchCachedTabs(String(new Date().getFullYear()));
  if (!tabs) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysSinceMonday = (today.getDay() + 6) % 7;
  const from = new Date(today);
  from.setDate(today.getDate() - daysSinceMonday - 7);

  const to = new Date(today);
  to.setDate(today.getDate() - daysSinceMonday + 6);

  return [...tabs].reverse().filter(name => {
    const date = tabDate(name);
    return date !== null && date >= from && date <= to;
  });
};
