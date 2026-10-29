import { config } from '@/config/prolo';
import { isBelianiUrl, isPreviewableUrl, parseProloIssueUrl, parseProloPageUrl } from '@/config/linkPreview';
import { fetchProloPagePreview } from './proloPagePreview';
import type { IssueListResponse } from '@/entrypoints/issue.content/lib/types';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  details?: string[];
  accent?: string;
}

export type LinkPreviewResult = ({ ok: true } & LinkPreview) | { ok: false; error: string };

const TIMEOUT_MS = 15000;
const MAX_HTML_BYTES = 512 * 1024;
const TOP_IMAGE_RE = /<img\b[^>]*\balt\s*=\s*["']Top Image["'][^>]*>/i;

export async function handleFetchLinkPreview(url: unknown): Promise<LinkPreviewResult> {
  if (typeof url !== 'string' || !isPreviewableUrl(url)) {
    return { ok: false, error: 'url not allowed' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const issue = parseProloIssueUrl(url);
    if (issue) return await fetchIssuePreview(url, issue.origin, issue.issueId, controller.signal);
    const proloPage = parseProloPageUrl(url);
    if (proloPage) return await fetchProloPagePreview(url, proloPage, controller.signal);
    return await fetchPagePreview(url, controller.signal);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPagePreview(url: string, signal: AbortSignal): Promise<LinkPreviewResult> {
  const resp = await fetch(url, {
    redirect: 'follow',
    credentials: 'include',
    signal,
    headers: { Accept: 'text/html' },
  });
  if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };
  if (!isBelianiUrl(resp.url)) return { ok: false, error: 'redirected outside allowed domains' };

  const html = await readHtml(
    resp,
    text => /<\/head>/i.test(text) && (/og:image/i.test(text) || TOP_IMAGE_RE.test(text)),
  );
  return { ok: true, ...parseMeta(html, resp.url) };
}

async function fetchIssuePreview(
  url: string,
  origin: string,
  issueId: string,
  signal: AbortSignal,
): Promise<LinkPreviewResult> {
  const apiUrl = `${origin}${config.paths.issueLogList}?page_id=${issueId}&show_with_inactive=1`;
  const resp = await fetch(apiUrl, { credentials: 'include', signal, headers: { Accept: 'application/json' } });
  if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}` };

  const data = (await resp.json().catch(() => null)) as IssueListResponse | null;
  const item = data?.issue_list?.find(entry => String(entry.id) === issueId);
  if (!item) return { ok: false, error: 'issue not found (not logged in to Prolo?)' };

  const [subject, ...rest] = (item.issue ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const done = Number(item.checkpoints_done ?? 0);
  const total = Number(item.checkpoints_total ?? 0);

  return {
    ok: true,
    url,
    title: subject ? `#${issueId} ${subject}` : `#${issueId}`,
    description: rest.join(' ') || undefined,
    siteName: `Prolo${item.issue_priority_name ? ` · ${item.issue_priority_name} priority` : ''}`,
    details: [
      formatIssueStatus(item.status),
      item.issue_board_column_name,
      item.solving_user_name,
      total > 0 ? `Checklist ${done}/${total}` : undefined,
    ].filter((detail): detail is string => !!detail),
    accent: item.issue_priority_color || undefined,
  };
}

function formatIssueStatus(status: string | undefined): string | undefined {
  if (!status) return undefined;
  if (status === 'close') return 'Closed';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function readHtml(resp: Response, isEnough: (text: string) => boolean): Promise<string> {
  if (!resp.body) return '';
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';

  while (received < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (isEnough(text)) break;
  }

  await reader.cancel().catch(() => {});
  return text;
}

function parseMeta(html: string, pageUrl: string): LinkPreview {
  const meta = new Map<string, string>();

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = (readAttr(tag, 'property') ?? readAttr(tag, 'name'))?.toLowerCase();
    const content = readAttr(tag, 'content');
    const value = content ? decodeEntities(content).trim() : '';
    if (key && value && !meta.has(key)) meta.set(key, value);
  }

  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
  const title = meta.get('og:title') ?? (titleTag ? decodeEntities(titleTag.trim()) : undefined);
  const topImageTag = html.match(TOP_IMAGE_RE)?.[0];
  const imageRaw =
    meta.get('og:image') ?? meta.get('twitter:image') ?? (topImageTag ? readAttr(topImageTag, 'src') : undefined);
  const description = meta.get('og:description') ?? meta.get('description');

  return {
    url: pageUrl,
    title: title || undefined,
    description: description && /\s/.test(description) ? description : undefined,
    image: imageRaw ? resolveUrl(imageRaw, pageUrl) : undefined,
    siteName: meta.get('og:site_name') ?? new URL(pageUrl).hostname,
  };
}

function readAttr(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
}

function resolveUrl(value: string, base: string): string | undefined {
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}
