import type { ChecklistMode, IssueListItem, IssueTypeInfo, ParsedIssueInfo } from '../lib/types';

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

  return null;
};
