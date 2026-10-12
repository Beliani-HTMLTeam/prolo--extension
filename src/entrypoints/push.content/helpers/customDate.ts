import { parseCampaignName } from './slugMapper';

/**
 * Custom date override.
 *
 * Everything date-related (image URL, LP path, click_action, warnings) is derived
 * from the campaign name by slugMapper. Instead of touching every derivation, we
 * build an "effective" campaign name with the date replaced, and feed that to
 * generation. The result is only accepted if parseCampaignName reads back exactly
 * the chosen date, so a wrong guess about the name format can never slip through.
 */

export interface CustomDateResult {
  /** Name to derive date-dependent data from. Equals the original when no override applies. */
  name: string;
  applied: boolean;
  error: string | null;
}

const fullYear = (y: unknown): string => {
  const s = String(y ?? '');
  return s.length === 2 ? `20${s}` : s;
};

const readsBackAs = (name: string, day: string, month: string, year: string): boolean => {
  const parsed = parseCampaignName(name);
  return (
    !!parsed?.hasDate &&
    Number(parsed.day) === Number(day) &&
    Number(parsed.month) === Number(month) &&
    fullYear(parsed.year) === year
  );
};

/** Formats an ISO date (YYYY-MM-DD) as DD.MM.YYYY for display. */
export const formatIsoDate = (isoDate: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : isoDate;
};

/**
 * @param campaignName original tab name, e.g. "05.10.26 Autumn Sale"
 * @param isoDate value of an <input type="date">, e.g. "2026-10-12" ('' = no override)
 */
export function applyCustomDate(campaignName: string, isoDate: string): CustomDateResult {
  if (!isoDate || !campaignName?.trim()) return { name: campaignName, applied: false, error: null };

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!iso) return { name: campaignName, applied: false, error: 'Invalid date.' };

  const [, yyyy, mm, dd] = iso;
  const yy = yyyy.slice(2);
  const candidates: string[] = [];

  const match = /(\d{2})([.-])(\d{2})([.-])(\d{2,4})/.exec(campaignName);

  if (match) {
    // Replace the existing date, keeping its separators and year length.
    const [whole, first, sep1, , sep2, last] = match;
    const start = match.index;
    const replace = (date: string) => campaignName.slice(0, start) + date + campaignName.slice(start + whole.length);

    const yearOut = last.length === 2 ? yy : yyyy;
    const dayFirst = replace(`${dd}${sep1}${mm}${sep2}${yearOut}`);
    const yearFirst = replace(`${yy}${sep1}${mm}${sep2}${dd}`);

    // If the parser reads the last group as the day, the name is year-first.
    const parsed = parseCampaignName(campaignName);
    const isYearFirst =
      !!parsed?.hasDate && Number(parsed.day) === Number(last) && Number(parsed.day) !== Number(first);

    candidates.push(...(isYearFirst ? [yearFirst, dayFirst] : [dayFirst, yearFirst]));
  } else {
    // No date in the name yet — try the usual layouts.
    candidates.push(
      `${dd}.${mm}.${yy} ${campaignName}`,
      `${dd}.${mm}.${yyyy} ${campaignName}`,
      `${campaignName} ${dd}.${mm}.${yy}`,
      `${campaignName} ${dd}.${mm}.${yyyy}`,
    );
  }

  const name = candidates.find(candidate => readsBackAs(candidate, dd, mm, yyyy));
  if (name) return { name, applied: true, error: null };

  return {
    name: campaignName,
    applied: false,
    error: `Couldn't apply ${dd}.${mm}.${yyyy} to "${campaignName}". The derived date is used instead.`,
  };
}

/** Props the dashboard accepts for the date override (all optional — nothing breaks if not wired). */
export interface CustomDateProps {
  /** ISO date (YYYY-MM-DD) or '' */
  customDate?: string;
  effectiveCampaignName?: string;
  isCustomDateActive?: boolean;
  /** Date changed since the last Generate All for this campaign. */
  isCustomDatePending?: boolean;
  customDateError?: string | null;
  onSetCustomDate?: (isoDate: string) => void;
  onClearCustomDate?: () => void;
}
