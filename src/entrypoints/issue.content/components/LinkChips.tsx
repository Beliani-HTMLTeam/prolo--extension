import { Icon } from '@iconify/react';
import styles from '../styles/layout.module.scss';
import type { IssueLink } from '../lib/types';
import ChipPopover from './ChipPopover';

const MAX_VISIBLE_CHIPS = 6;

const LINK_ICON_MAP: [string, string][] = [
  ['figma', 'simple-icons:figma'],
  ['spreadsheet', 'mdi:google-spreadsheet'],
  ['translation', 'mdi:translate'],
  ['dropbox', 'simple-icons:dropbox'],
  ['newsletter', 'mdi:email-newsletter'],
  ['banner', 'mdi:image-multiple'],
  ['planning', 'mdi:email-send'],
];

const getLinkIcon = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, icon] of LINK_ICON_MAP) {
    if (lower.includes(key)) return icon;
  }
  return 'mdi:link-variant';
};

/** Shorten long field names for display (match old createLinkChip behaviour). */
const getLinkLabel = (name: string): string => {
  return (
    name
      .replace(/translation spreadsheet newsletter/i, 'Translations')
      .replace(/spreadsheet newsletter/i, 'Spreadsheet')
      .replace(/newsletter template/i, 'Newsletter')
      .replace(/Newsletter Campaign banners/i, 'Banners')
      .replace(/Campaign dropbox/i, 'Dropbox')
      .replace(/Figma newsletter link/i, 'Figma')
      .replace(/Newsletter testing issue/i, 'Testing')
      .trim() || name
  );
};

// "(NEW) Figma Link (Graphic Designer to add)" -> "Figma Link NEW", "Notes (references...) 2" -> "Notes"
const getChipLabel = (name: string): string => {
  const version = name.match(/^\(((?:OLD|NEW|FINAL)(?: \d+)?)\)\s*/i);
  const withoutVersion = version ? name.slice(version[0].length) : name;
  const base =
    getLinkLabel(withoutVersion)
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s+\d+$/, '')
      .trim() || name;
  return version ? `${base} ${version[1].toUpperCase()}` : base;
};

const getHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// same field can hold links to different services, so a group is label + service
const getServiceLabel = (url: string): string => {
  const host = getHost(url);
  if (host.includes('figma.com')) return 'Figma';
  if (host.includes('dropbox.com')) return 'Dropbox';
  if (host.includes('google.com')) return 'Google';
  if (host.includes('prologistics.info')) return 'Prolo';
  return host;
};

// "figma.com · Black Week" - host plus the last readable path segment, so links of one service can be told apart
const getLinkDetail = (url: string): string => {
  try {
    const { hostname, pathname } = new URL(url);
    const segments = pathname.split('/').filter(Boolean);
    const last = segments.length > 0 ? decodeURIComponent(segments[segments.length - 1]) : '';
    const host = hostname.replace(/^www\./, '');
    const tail = last.length > 28 ? `${last.slice(0, 27)}…` : last;
    return tail ? `${host} · ${tail}` : host;
  } catch {
    return url;
  }
};

type LinkGroup = { key: string; label: string; links: IssueLink[] };

const groupLinks = (links: IssueLink[]): LinkGroup[] => {
  const groups: Array<LinkGroup & { service: string; baseLabel: string }> = [];
  for (const link of links) {
    const baseLabel = getChipLabel(link.name);
    const service = getServiceLabel(link.url);
    const group = groups.find(g => g.baseLabel === baseLabel && g.service === service);
    if (group) group.links.push(link);
    else groups.push({ key: `${baseLabel}|${service}`, label: baseLabel, baseLabel, service, links: [link] });
  }
  // two chips with the same label (one field, several services) get the service as a suffix
  for (const group of groups) {
    if (groups.filter(g => g.baseLabel === group.baseLabel).length > 1) group.label = `${group.baseLabel} · ${group.service}`;
  }
  return groups;
};

const LinkList = ({ links }: { links: IssueLink[] }) => (
  <div className={styles.popoverList}>
    {links.map((link, index) => (
      <a
        key={link.url}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.popoverLink}
        title={`${link.name}
${link.url}`}
      >
        <Icon icon={getLinkIcon(`${link.name} ${getHost(link.url)}`)} width="14" height="14" />
        <span className={styles.popoverLinkText}>
          {index + 1}. {getLinkDetail(link.url)}
        </span>
      </a>
    ))}
  </div>
);

const GroupChip = ({ group }: { group: LinkGroup }) => {
  const icon = <Icon icon={getLinkIcon(`${group.label} ${getHost(group.links[0].url)}`)} width="14" height="14" />;

  if (group.links.length === 1) {
    const [link] = group.links;
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkChip} title={link.name}>
        {icon}
        <span className={styles.linkChipLabel}>{group.label}</span>
      </a>
    );
  }

  return (
    <ChipPopover
      title={group.links.map(link => link.name).join('\n')}
      trigger={
        <>
          {icon}
          <span className={styles.linkChipLabel}>{group.label}</span>
          <span className={styles.linkChipCount}>{group.links.length}</span>
        </>
      }
    >
      <LinkList links={group.links} />
    </ChipPopover>
  );
};

// one chip per link kind, repeated kinds collapse into a counted dropdown, overflow goes into "+N"
const LinkChips = ({ links }: { links: IssueLink[] }) => {
  const groups = groupLinks(links);
  const visible = groups.slice(0, MAX_VISIBLE_CHIPS);
  const hidden = groups.slice(MAX_VISIBLE_CHIPS);
  const hiddenLinks = hidden.flatMap(group => group.links);

  return (
    <>
      {visible.map(group => (
        <GroupChip key={group.key} group={group} />
      ))}
      {hiddenLinks.length > 0 && (
        <ChipPopover trigger={<span className={styles.linkChipLabel}>+{hiddenLinks.length} more</span>}>
          <LinkList links={hiddenLinks} />
        </ChipPopover>
      )}
    </>
  );
};

export default LinkChips;
