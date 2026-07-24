import type { ChecklistMode, ChecklistOwner, IssueListItem, IssueTypeInfo, ParsedIssueInfo } from '../lib/types';

const ISSUE_TEXT_LIMIT = 160;

const truncateText = (text: string, limit = ISSUE_TEXT_LIMIT) => {
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 3)}...`;
};

export const parseIssueInfo = (issueItem: IssueListItem): ParsedIssueInfo => {
  const issueText = issueItem.issue || '';
  const [rawTitle = '', ...rest] = issueText.split('\n');
  const rawDescription = rest.join(' ');
  const issueDateMatch = rawTitle.match(/(\d{4}\.\d{2}\.\d{2})/);

  let dueDateStr: string | null = null;
  let dueDateName: string | null = null;
  let newsletterIssueId: number | null = null;

  if (issueItem.additional_fields) {
    for (const fields of Object.values(issueItem.additional_fields)) {
      for (const field of fields) {
        const lowerName = field.name.toLowerCase();
        if ((lowerName.includes('due date') || lowerName.includes('deadline')) && field.value) {
          dueDateStr = field.value;
          dueDateName = field.name;
        }
        if (lowerName.includes('newsletter production link') && field.value) {
          const match = field.value.match(/\/issue_logs\/(\d+)/);
          if (match) {
            newsletterIssueId = parseInt(match[1], 10);
          }
        }
      }
      if (dueDateStr && newsletterIssueId) break;
    }
  }

  let dueDate: Date | null = null;
  if (dueDateStr) {
    const parts = dueDateStr.split('.');
    if (parts.length === 2) {
      const issueDate = new Date(issueItem.added_time || Date.now());
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = issueDate.getFullYear();
      
      // fix up deadlines
      if (month < issueDate.getMonth() - 2) {
        year += 1;
      }
      
      dueDate = new Date(year, month, day);
    } else if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      dueDate = new Date(year, month, day);
    }
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
    issueCreatedAt: issueItem.added_time || '',
    newsletterIssueId,
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

  if (names.includes('SM Paid') || names.includes('SMGT') || names.includes('Technology Graphic Task') || names.includes('GBGT')) {
    return 'graphics';
  }

  return null;
};

export const getChecklistOwner = (issueTypes: IssueTypeInfo[]): ChecklistOwner => {
  const names = issueTypes.map(type => type.name);

  if (names.includes('Sunday newsletter') || names.includes('Newsletter production')) {
    return 'HTML';
  }

  if (names.includes('Newsletter campaign banners')) {
    return 'GRAPHICS';
  }

  if (names.includes('SM Paid') || names.includes('SMGT') || names.includes('Technology Graphic Task') || names.includes('GBGT')) {
    return 'GRAPHICS';
  }

  return null;
};
