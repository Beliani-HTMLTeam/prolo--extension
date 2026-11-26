import type { Comment } from '../api/comments';

export type BannerEntry = { name: string; bannerId: string };

// full url first (so "Storage:https://..." splits at the url), bare "shop_banner.php?id=" as fallback
const BANNER_URL = /(?:https?:\/\/|www\.)\S*?shop_banner\.php\?id=(\d+)|[^\s:]*shop_banner\.php\?id=(\d+)/i;
// "0 - Name", "0 Name", "0. Name", "0) Name", "0: Name"
const NUMBERED_PREFIX = /^(\d+)\s*[.):]?\s*[-–—]?\s*(.*)$/;
const LEADING_MENTIONS = /^(?:@[^@()]+\(\d+\)\s*)+/;
const EDGE_SEPARATORS = /^[\s\-–—:.]+|[\s\-–—:.]+$/g;

export const htmlToLines = (html: string): string[] =>
  html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

/** One pasted banner line -> entry. Title is normalised to "N - Name". */
export const parseBannerLine = (line: string): BannerEntry | null => {
  const url = BANNER_URL.exec(line);
  if (!url) return null;

  const prefix = line.slice(0, url.index).replace(LEADING_MENTIONS, '').trim();
  const numbered = prefix.match(NUMBERED_PREFIX);
  if (!numbered) return null;

  const name = numbered[2].replace(EDGE_SEPARATORS, '').replace(/\s+/g, ' ');
  if (!/\p{L}/u.test(name)) return null;

  return { name: `${numbered[1]} - ${name}`, bannerId: url[1] ?? url[2] };
};

const parseComment = (html: string): BannerEntry[] => {
  // same number twice (e.g. "PL: 0 - ..." then "Other shops: 0 - ...") -> the later line wins
  const byNumber = new Map<string, BannerEntry>();
  for (const line of htmlToLines(html)) {
    const entry = parseBannerLine(line);
    if (!entry) continue;
    const num = entry.name.split(' ')[0];
    byNumber.delete(num);
    byNumber.set(num, entry);
  }
  return [...byNumber.values()];
};

/** The comment with the most banner lines wins (PL-only follow-ups have one), newest on a tie. */
export const parseBannerEntries = (comments: Comment[]): BannerEntry[] => {
  const newestFirst = [...comments].sort(
    (a, b) => new Date(b.create_date).getTime() - new Date(a.create_date).getTime(),
  );

  let best: BannerEntry[] = [];
  for (const comment of newestFirst) {
    const entries = parseComment(comment.comment);
    if (entries.length > best.length) best = entries;
  }
  return best;
};
