import { getShopId } from '../../lib/shopIdMap';
import { COLUMN_IDS } from '../../api/checklistShared';
import type { ChecklistStatus, ChecklistTableRow } from '../../lib/types';

export const STATUS_FIELD_BY_COLUMN_ID: Record<string, keyof ChecklistTableRow> = {
  [COLUMN_IDS.TRANSLATIONS]: 'translations',
  [COLUMN_IDS.TEST_REQUEST]: 'testRequest',
  [COLUMN_IDS.TIMER_DONE]: 'timerDone',
  [COLUMN_IDS.PUSH_DONE]: 'pushDone',
  [COLUMN_IDS.TEST_SENT]: 'testSent',
  [COLUMN_IDS.NSLT_ACCEPTED]: 'nsltAccepted',
  [COLUMN_IDS.NSLT_A_ACCEPTED]: 'nsltAAccepted',
  [COLUMN_IDS.NSLT_B_ACCEPTED]: 'nsltBAccepted',
  [COLUMN_IDS.LP_ACCEPTED]: 'lpAccepted',
};

export const getStatusValue = (row: ChecklistTableRow, columnId: string): ChecklistStatus => {
  const columnStatus = row.columnStatuses?.[columnId];
  if (typeof columnStatus === 'number') {
    return columnStatus as ChecklistStatus;
  }

  const legacyField = STATUS_FIELD_BY_COLUMN_ID[columnId];
  if (legacyField) {
    const value = row[legacyField];
    if (typeof value === 'number') {
      return value as ChecklistStatus;
    }
  }

  if (columnId.startsWith('cgb:')) {
    return (row.cgbStatuses?.[columnId] ?? 0) as ChecklistStatus;
  }

  return 0;
};

const LINK_ROW_FIELD_BY_COLUMN_ID: Record<string, keyof ChecklistTableRow> = {
  [COLUMN_IDS.NSLT_ID]: 'nsltId',
  [COLUMN_IDS.NSLT_A_ID]: 'nsltAId',
  [COLUMN_IDS.NSLT_B_ID]: 'nsltBId',
  [COLUMN_IDS.LP_ID]: 'lpId',
  [COLUMN_IDS.LP_A_ID]: 'lpAId',
  [COLUMN_IDS.LP_B_ID]: 'lpBId',
};

const LP_LINK_COLUMN_IDS = new Set<string>([COLUMN_IDS.LP_ID, COLUMN_IDS.LP_A_ID, COLUMN_IDS.LP_B_ID]);

export const getLinkValue = (row: ChecklistTableRow, columnId: string): string | null => {
  const fromColumnMap = row.columnValues?.[columnId];
  if (fromColumnMap) {
    return fromColumnMap;
  }

  const field = LINK_ROW_FIELD_BY_COLUMN_ID[columnId];
  return field ? ((row[field] as string | null) ?? null) : null;
};

// LP links need a shop_id; NSLT links don't
export const getLinkUrl = (row: ChecklistTableRow, columnId: string, id: string): string | null => {
  const base = window.location.origin;

  if (LP_LINK_COLUMN_IDS.has(columnId)) {
    const shopId = getShopId(row.shop);
    return shopId ? `${base}/shop_content.php?id=${id}&shop_id=${shopId}` : null;
  }

  return `${base}/news_email.php?id=${id}`;
};

const REQUIRED_ID_FIELD_BY_ACCEPTED_COLUMN_ID: Record<string, keyof ChecklistTableRow> = {
  [COLUMN_IDS.NSLT_ACCEPTED]: 'nsltId',
  [COLUMN_IDS.NSLT_A_ACCEPTED]: 'nsltAId',
  [COLUMN_IDS.NSLT_B_ACCEPTED]: 'nsltBId',
  [COLUMN_IDS.LP_ACCEPTED]: 'lpId',
  [COLUMN_IDS.LP_A_ACCEPTED]: 'lpAId',
  [COLUMN_IDS.LP_B_ACCEPTED]: 'lpBId',
};

export const isColumnHiddenForRow = (columnId: string, row: ChecklistTableRow, isCgbView: boolean): boolean => {
  const hasTestSentCheckpoint = !!row.columnCheckpointRefs?.[COLUMN_IDS.TEST_SENT];

  if (columnId === COLUMN_IDS.TEST_REQUEST) return !isCgbView && !hasTestSentCheckpoint;
  if (columnId === COLUMN_IDS.TEST_SENT) return !hasTestSentCheckpoint;

  const requiredIdField = REQUIRED_ID_FIELD_BY_ACCEPTED_COLUMN_ID[columnId];
  return requiredIdField ? !row[requiredIdField] : false;
};

export const canEditChecklist = (checklistOwner: string | null, team: string | null): boolean =>
  checklistOwner === team || checklistOwner === null;
