import { useEffect, useRef } from 'react';
import { shopToMentionTagMap } from '../../lib/shopMaps';
import { COLUMN_IDS } from '../../api/checklistShared';
import { getStatusValue } from './cellHelpers';
import type { ChecklistColumn, ChecklistStatus, ChecklistTableRow } from '../../lib/types';

type SetRows = React.Dispatch<React.SetStateAction<ChecklistTableRow[]>>;

const buildMentionCommentText = (rows: ChecklistTableRow[]): string => {
  const translationTags = new Set<string>();
  const testRequestTags = new Set<string>();

  rows.forEach(row => {
    const mentionTag = shopToMentionTagMap[row.shop];
    if (!mentionTag) return;

    if (getStatusValue(row, COLUMN_IDS.TRANSLATIONS) === 2) translationTags.add(mentionTag);
    if (getStatusValue(row, COLUMN_IDS.TEST_REQUEST) === 2) testRequestTags.add(mentionTag);
  });

  const parts: string[] = [];
  if (translationTags.size > 0) parts.push(`${Array.from(translationTags).join(' ')} please translate :)`);
  if (testRequestTags.size > 0) parts.push(`${Array.from(testRequestTags).join(' ')} please test :)`);

  return parts.join('\n');
};

export const useMentionCommentSync = (rows: ChecklistTableRow[], columns: ChecklistColumn[], setRows: SetRows) => {
  const prevTextRef = useRef<string | null>(null);

  useEffect(() => {
    const hasMentionColumn = columns.some(
      column => column.id === COLUMN_IDS.TRANSLATIONS || column.id === COLUMN_IDS.TEST_REQUEST,
    );
    if (!hasMentionColumn) return;

    const text = buildMentionCommentText(rows);
    if (prevTextRef.current === text) return;
    prevTextRef.current = text;

    document.dispatchEvent(new CustomEvent('richchat:set', { detail: { text } }));
  }, [rows, columns]);

  useEffect(() => {
    const clearMentionSelection = () => {
      setRows(prevRows =>
        prevRows.map(row => {
          const hasTranslation = getStatusValue(row, COLUMN_IDS.TRANSLATIONS) === 2;
          const hasTestRequest = getStatusValue(row, COLUMN_IDS.TEST_REQUEST) === 2;
          if (!hasTranslation && !hasTestRequest) return row;

          const cleared = 0 as ChecklistStatus;
          const nextRow: ChecklistTableRow = { ...row, columnStatuses: { ...(row.columnStatuses ?? {}) } };
          if (hasTranslation) {
            nextRow.columnStatuses[COLUMN_IDS.TRANSLATIONS] = cleared;
            nextRow.translations = cleared;
          }
          if (hasTestRequest) {
            nextRow.columnStatuses[COLUMN_IDS.TEST_REQUEST] = cleared;
            nextRow.testRequest = cleared;
          }
          return nextRow;
        }),
      );
    };

    document.addEventListener('richchat:sent', clearMentionSelection);
    return () => document.removeEventListener('richchat:sent', clearMentionSelection);
  }, [setRows]);
};
