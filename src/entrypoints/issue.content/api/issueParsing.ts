import type {
  AdditionalFieldEntry,
  ChecklistMode,
  ChecklistOwner,
  IssueExtraField,
  IssueListItem,
  IssueTypeInfo,
  ParsedIssueInfo,
} from '../lib/types';
import { isDueDateFieldName, parseDueValue } from '../utils/dueDate';

const ISSUE_TEXT_LIMIT = 160;

const truncateText = (text: string, limit = ISSUE_TEXT_LIMIT) => {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 3)}...`;
};

// multiselect value is a list of option ids, names come from the field's options (or the joined text_value)
const getSelectedOptionNames = (field: AdditionalFieldEntry): string[] => {
  const ids = Array.isArray(field.value) ? (field.value as string[]) : [];
  const byId = new Map((field.values ?? []).map(option => [String(option.id), option.answer_value]));
  const names = ids.map(id => byId.get(String(id))).filter((name): name is string => !!name);
  if (names.length > 0) return names;
  return field.text_value ? field.text_value.split(';').map(name => name.trim()).filter(Boolean) : [];
};

export const parseIssueInfo =(issueItem: IssueListItem): ParsedIssueInfo => {
  const issueText = issueItem.issue || '';
  const [rawTitle = '', ...rest] = issueText.split('\n');
  const rawDescription = rest.join(' ');
  // title may contain several dates, the send date is usually the one after the weekday ("Newsletter X - Thursday 2026.10.08")
  const issueDateMatch =
    rawTitle.match(/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{4}\.\d{2}\.\d{2})/i) ??
    rawTitle.match(/(\d{4}\.\d{2}\.\d{2})/);

  let newsletterIssueId: number | null = null;
  const dueFields: Array<{ name: string; value: string }> = [];
  const tags: string[] = [];
  const extraFields: IssueExtraField[] = [];

  if (issueItem.additional_fields) {
    for (const fields of Object.values(issueItem.additional_fields)) {
      for (const field of fields) {
        const value = typeof field.value === 'string' ? field.value.trim() : '';
        if (isDueDateFieldName(field.name) && value) {
          dueFields.push({ name: field.name.trim(), value });
        } else if (Array.isArray(field.value) && /tags/i.test(field.name)) {
          for (const tag of getSelectedOptionNames(field)) {
            if (!tags.includes(tag)) tags.push(tag);
          }
        } else if (value && value !== '---' && !/^https?:\/\/\S+$/i.test(value)) {
          // plain-url fields are shown as link chips already, the rest is brief/notes text
          extraFields.push({ name: field.name.trim(), value });
        }
        if (field.name.toLowerCase().includes('newsletter production link') && value) {
          const match = value.match(/\/issue_logs\/(\d+)/);
          if (match) {
            newsletterIssueId = parseInt(match[1], 10);
          }
        }
      }
    }
  }

  // first field with an unambiguous date wins, otherwise show the first field as plain text
  let dueDate: Date | null = null;
  let dueDateName: string | null = null;
  let dueDateText: string | null = null;
  for (const field of dueFields) {
    const parsed = parseDueValue(field.value, issueItem.added_time);
    if (parsed.date) {
      dueDate = parsed.date;
      dueDateName = field.name;
      dueDateText = parsed.isPureDate ? null : field.value;
      break;
    }
  }
  if (!dueDate && dueFields.length > 0) {
    dueDateName = dueFields[0].name;
    dueDateText = dueFields[0].value;
  }

  return {
    title: truncateText(rawTitle),
    description: truncateText(rawDescription),
    issueDate: issueDateMatch?.[1] ?? '',
    issueTypes: issueItem.issue_type ?? [],
    solvingUserName: issueItem.solving_user_name ?? '',
    status: issueItem.status ?? '',
    priorityName: issueItem.issue_priority_name ?? '',
    priorityColor: issueItem.issue_priority_color ?? '',
    boardColumnName: issueItem.issue_board_column_name ?? '',
    checkpointsDone: Number(issueItem.checkpoints_done ?? 0),
    checkpointsTotal: Number(issueItem.checkpoints_total ?? 0),
    dueDate,
    dueDateName,
    dueDateText,
    issueCreatedAt: issueItem.added_time || '',
    newsletterIssueId,
    tags,
    extraFields,
  };
};

export const getChecklistMode = (issueTypes: IssueTypeInfo[]): ChecklistMode => {
  const names = issueTypes.map(type => type.name);

  if (names.includes('Sunday newsletter')) {
    return 'sunday';
  }

  if (names.includes('Newsletter production')) {
    return 'newsletter';
  }

  if (names.includes('CGB') || names.includes('Newsletter campaign banners')) {
    return 'cgb';
  }

  if (hasGraphicsTag(names)) {
    return 'graphics';
  }

  // type name has a trailing space in prolo ("Campaign "), no shop checklists - header, links and chat only
  if (names.some(name => name.trim() === 'Campaign')) {
    return 'campaign';
  }

  return null;
};

// 'cgb' mode also covers 'Newsletter campaign banners' issues, this one is CGB only
export const isCgbIssue = (issueTypes: IssueTypeInfo[]): boolean => issueTypes.some(type => type.name === 'CGB');

// issue tags (types) that mark a task as ours (graphics team); plain 'SM Paid' / 'Content Graphics' issues belong to other teams
const GRAPHICS_TAGS = ['SMGT', 'GBGT', 'Technology Graphic Task', 'Agata Graphic', 'Andriana Graphic', 'Graphic Anastasiia'];

const hasGraphicsTag = (names: string[]) => names.some(name => GRAPHICS_TAGS.includes(name.trim()));

export const getChecklistOwner =(issueTypes: IssueTypeInfo[]): ChecklistOwner => {
  const names = issueTypes.map(type => type.name);

  if (names.includes('Sunday newsletter') || names.includes('Newsletter production')) {
    return 'HTML';
  }

  if (names.includes('Newsletter campaign banners')) {
    return 'GRAPHICS';
  }

  // personal graphic tags (e.g. on CGB issues) don't make graphics the owner, HTML ticks checklists there
  if (names.includes('SM Paid') || names.includes('SMGT') || names.includes('Technology Graphic Task') || names.includes('GBGT')) {
    return 'GRAPHICS';
  }

  return null;
};
