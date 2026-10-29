export const LINK_PREVIEW_DOMAINS = [
  'beliani.at',
  'beliani.be',
  'beliani.ch',
  'beliani.co.uk',
  'beliani.com',
  'beliani.cz',
  'beliani.de',
  'beliani.dk',
  'beliani.es',
  'beliani.fi',
  'beliani.fr',
  'beliani.hr',
  'beliani.hu',
  'beliani.it',
  'beliani.net',
  'beliani.nl',
  'beliani.no',
  'beliani.pl',
  'beliani.pt',
  'beliani.ro',
  'beliani.se',
  'beliani.si',
  'beliani.sk',
];

const PROLO_ISSUE_PATH_RE = /^\/react\/logs\/issue_logs\/(\d+)\/?$/;

const PROLO_PAGE_KINDS = {
  '/shop_content.php': 'shopContent',
  '/news_email.php': 'newsEmail',
  '/shop_banner.php': 'shopBanner',
} as const;

export type ProloPage = {
  kind: (typeof PROLO_PAGE_KINDS)[keyof typeof PROLO_PAGE_KINDS];
  fetchUrl: string;
  id: string;
};

export function isPreviewableUrl(raw: string): boolean {
  return isBelianiUrl(raw) || parseProloIssueUrl(raw) !== null || parseProloPageUrl(raw) !== null;
}

export function isBelianiUrl(raw: string): boolean {
  const url = parseHttpsUrl(raw);
  if (!url) return false;
  return LINK_PREVIEW_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
}

export function parseProloIssueUrl(raw: string): { origin: string; issueId: string } | null {
  const url = parseProloUrl(raw);
  const issueId = url?.pathname.match(PROLO_ISSUE_PATH_RE)?.[1];
  return url && issueId ? { origin: url.origin, issueId } : null;
}

export function parseProloPageUrl(raw: string): ProloPage | null {
  const url = parseProloUrl(raw);
  if (!url || !(url.pathname in PROLO_PAGE_KINDS)) return null;
  const kind = PROLO_PAGE_KINDS[url.pathname as keyof typeof PROLO_PAGE_KINDS];

  const id = url.searchParams.get('id') ?? '';
  const shopId = url.searchParams.get('shop_id');
  if (!/^\d+$/.test(id) || (shopId !== null && !/^\d+$/.test(shopId))) return null;

  const fetchUrl = `${url.origin}${url.pathname}?id=${id}${shopId ? `&shop_id=${shopId}` : ''}`;
  return { kind, fetchUrl, id };
}

function parseProloUrl(raw: string): URL | null {
  const url = parseHttpsUrl(raw);
  if (!url) return null;
  return url.hostname === 'prologistics.info' || url.hostname.endsWith('.prologistics.info') ? url : null;
}

function parseHttpsUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
