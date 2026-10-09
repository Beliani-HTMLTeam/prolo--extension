const DAY_MS = 24 * 60 * 60 * 1000;
// a day.month without a year earlier than this before the issue creation is treated as next year
const PAST_TOLERANCE_MS = 60 * DAY_MS;

const PURE_DATE = /^(\d{1,2})([./-])(\d{1,2})(?:\2(\d{4}|\d{2}))?\.?$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
// single "d.m", "d.m.yy", "d.m.yyyy" (or with "/") inside free text, not part of a longer number/url
const DATE_IN_TEXT = /(?<![\d./])(\d{1,2})([./])(\d{1,2})(?:\2(\d{4}|\d{2}))?(?![\d/]|\.\d)/g;
const RANGE = /\d\s*[-–]\s*\d/;

export type ParsedDueValue = {
  date: Date | null;
  // true when the whole field is just a date, false when the date was found inside free text
  isPureDate: boolean;
};

const buildDate = (year: number, month: number, day: number): Date | null => {
  const date = new Date(year, month - 1, day);
  // rejects 31.02, 13.13 etc. instead of letting Date roll them over
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const parseCreatedAt = (createdAt?: string) => {
  const created = createdAt ? new Date(createdAt.replace(' ', 'T')) : new Date();
  if (Number.isNaN(created.getTime())) return new Date();
  created.setHours(0, 0, 0, 0);
  return created;
};

const toDate = (day: string, month: string, year: string | undefined, createdAt?: string): Date | null => {
  const d = Number(day);
  const m = Number(month);
  if (year) {
    return buildDate(year.length === 2 ? 2000 + Number(year) : Number(year), m, d);
  }

  const created = parseCreatedAt(createdAt);
  const sameYear = buildDate(created.getFullYear(), m, d);
  if (sameYear && sameYear.getTime() < created.getTime() - PAST_TOLERANCE_MS) {
    return buildDate(created.getFullYear() + 1, m, d);
  }
  return sameYear;
};

/**
 * Parses free-form "Due date" / "Deadline" field values. People type anything there
 * ("23.10", "30/09/2026", "ASAP", "Till 21.02.2025, max. 24.02.2025", links...),
 * so a date is returned only when there is exactly one unambiguous date in the value.
 */
export const parseDueValue = (rawValue: string, createdAt?: string): ParsedDueValue => {
  const value = rawValue.trim().replace(/^\.+/, '');

  const iso = value.match(ISO_DATE);
  if (iso) return { date: buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3])), isPureDate: true };

  const pure = value.match(PURE_DATE);
  if (pure) return { date: toDate(pure[1], pure[3], pure[4], createdAt), isPureDate: true };

  const text = value.replace(/https?:\/\/\S+/g, ' ');
  if (RANGE.test(text)) return { date: null, isPureDate: false };

  const matches = [...text.matchAll(DATE_IN_TEXT)];
  if (matches.length !== 1) return { date: null, isPureDate: false };

  const [, day, , month, year] = matches[0];
  return { date: toDate(day, month, year, createdAt), isPureDate: false };
};

export const isDueDateFieldName = (name: string) => /due\s+date|deadline/i.test(name);
