import type { IssueListItem, IssueLink } from '../lib/types';

const isUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const extractUrlsFromText = (text: string): string[] => {
  const urls: string[] = [];
  for (const match of text.matchAll(/(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi)) {
    // trailing punctuation belongs to the sentence, not the url
    const cleaned = match[0].replace(/[.,;:!?]+$/, '');
    const url = cleaned.startsWith('www.') ? `https://${cleaned}` : cleaned;
    if (isUrl(url) && !urls.includes(url)) urls.push(url);
  }
  return urls;
};

const parseFigmaVersions =(text: string): Array<{ type: string; url: string }> => {
  const versions: Array<{ type: string; url: string }> = [];
  // viva chat gpt for this beautiful regex
  const regex = /\b(OLD|NEW|FINAL)\b(?:\s*[-:]?\s*(\d+))?[\s:\-]*((?:https?:\/\/|www\.)\S+)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const baseType = match[1].toUpperCase();
    const versionNumber = match[2];
    const type = versionNumber ? `${baseType} ${versionNumber}` : baseType;
    const rawUrl = match[3];
    const url = rawUrl.startsWith('www.') ? `https://${rawUrl}` : rawUrl;
    versions.push({ type, url });
  }

  return versions;
};

export const extractIssueLinks = (item: IssueListItem): IssueLink[] => {
  const links: IssueLink[] = [];
  const allFields = item.additional_fields;
  if (!allFields) return links;

  for (const fields of Object.values(allFields)) {
    if (!Array.isArray(fields)) continue;

    for (const field of fields) {
      // tag/select fields come as arrays, they hold no links
      if (!field.value || typeof field.value !== 'string') continue;

      const versions = parseFigmaVersions(field.value);
      if (versions.length > 0) {
        versions.forEach(version => {
          if (isUrl(version.url)) {
            links.push({ name: `(${version.type}) ${field.name}`, url: version.url });
          }
        });
        continue;
      }

      if (isUrl(field.value)) {
        links.push({ name: field.name, url: field.value });
        continue;
      }

      // free text with links inside ("new: https://... Graphics: https://...")
      const urls = extractUrlsFromText(field.value);
      urls.forEach((url, index) => {
        links.push({ name: urls.length > 1 ? `${field.name} ${index + 1}` : field.name, url });
      });
    }
  }

  // same url can sit in several fields
  return links.filter((link, index) => links.findIndex(other => other.url === link.url) === index);
};
