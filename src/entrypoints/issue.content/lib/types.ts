export type ChecklistStatus = 0 | 1 | 2;

export type ChecklistMode = 'newsletter' | 'cgb' | null;

export type ChecklistTableRow = {
  shop: string;
  nsltId: string | null;
  nsltAId: string | null;
  nsltBId: string | null;
  lpId: string | null;
  translations: ChecklistStatus;
  testRequest: ChecklistStatus;
  timerDone: ChecklistStatus;
  pushDone: ChecklistStatus;
  testSent: ChecklistStatus;
  nsltAccepted: ChecklistStatus;
  nsltAAccepted: ChecklistStatus;
  nsltBAccepted: ChecklistStatus;
  lpAccepted: ChecklistStatus;
  bannersApproved: ChecklistStatus;
  bannersCheckedMobile: ChecklistStatus;
  bannersCheckedDesktop: ChecklistStatus;
  cgbStatuses?: Record<string, ChecklistStatus>;
  cgbCheckpointRefs?: Record<string, { checklistId: string; checkpointId: string }>;
  checkpointRefs: {
    translations?: { checklistId: string; checkpointId: string };
    testRequest?: { checklistId: string; checkpointId: string };
    testSent?: { checklistId: string; checkpointId: string };
    nsltAccepted?: { checklistId: string; checkpointId: string };
    nsltAAccepted?: { checklistId: string; checkpointId: string };
    nsltBAccepted?: { checklistId: string; checkpointId: string };
    lpAccepted?: { checklistId: string; checkpointId: string };
    bannersApproved?: { checklistId: string; checkpointId: string };
    bannersCheckedMobile?: { checklistId: string; checkpointId: string };
    bannersCheckedDesktop?: { checklistId: string; checkpointId: string };
  };
  order: number;
};

export type ChecklistTableData = {
  headers: string[];
  rows: ChecklistTableRow[];
  hasGroupedNslt?: boolean;
};

export type ChecklistApiResponse = {
  checklists: ChecklistApiChecklist[];
  success: boolean;
  _exec_time: number;
};

export type ChecklistApiChecklist = {
  id: string;
  title: string;
  ordering: string;
  enable_to_copy: string;
  enable_checklist_to_copy_changed_by?: string;
  checkpoints: ChecklistApiCheckpoint[];
};

export type ChecklistApiCheckpoint = {
  id: string;
  description: string;
  ordering: string;
  done: string;
  changed_by?: string;
};

export type IssueTypeInfo = {
  id: string;
  name: string;
  inactive: string | number;
  color?: string;
  issueflow_can_display?: number;
};

export type AdditionalFieldEntry = {
  id: string;
  name: string;
  value: string;
};

export type IssueListItem = {
  id: string;
  issue: string;
  issue_type?: IssueTypeInfo[];
  additional_fields?: Record<string, AdditionalFieldEntry[]>;
  solving_user_name?: string;
  status?: string;
  issue_priority_name?: string;
  issue_priority_color?: string;
  issue_board_column_name?: string;
  checkpoints_done?: string | number;
  checkpoints_total?: string | number;
};

export type IssueLink = { name: string; url: string };

export type IssueListResponse = {
  issue_list: IssueListItem[];
  _exec_time?: number;
};

export type ParsedIssueInfo = {
  title: string;
  description: string;
  issueDate: string;
  issueTypes: IssueTypeInfo[];
  solvingUserName: string;
  status: string;
  priorityName: string;
  priorityColor: string;
  boardColumnName: string;
  checkpointsDone: number;
  checkpointsTotal: number;
};

export type IssueInfoViewModel = ParsedIssueInfo & {
  mode: ChecklistMode;
};

export type MentionUser = {
  id: string;
  value: string;
  key: string;
};

export type SpreadsheetTranslations = {
  timer: Record<string, boolean> | null;
  push: Record<string, boolean> | null;
};
