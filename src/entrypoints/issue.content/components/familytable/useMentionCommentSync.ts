import { useEffect, useRef, useState } from 'react';
import { shopToMentionTagMap } from '../../lib/shopMaps';
import { COLUMN_IDS } from '../../api/checklistShared';
import { TEST_REQUEST_CHANGE_EVENT, type TestRequestChangeDetail } from '../../lib/testRequest';
import { getStatusValue } from './cellHelpers';
import type { ChecklistStatus, ChecklistTableRow } from '../../lib/types';

type SetRows = React.Dispatch<React.SetStateAction<ChecklistTableRow[]>>;

const buildMentionCommentText = (rows: ChecklistTableRow[], testRequestTags: string[]): string => {
  const translationTags = new Set<string>();

  rows.forEach(row => {
    const mentionTag = shopToMentionTagMap[row.shop];
    if (!mentionTag) return;

    if (getStatusValue(row, COLUMN_IDS.TRANSLATIONS) === 2) translationTags.add(mentionTag);
  });

  const parts: string[] = [];
  if (translationTags.size > 0) parts.push(`${Array.from(translationTags).join(' ')} please translate :)`);
  if (testRequestTags.length > 0) parts.push(`${testRequestTags.join(' ')} please test :)`);

  return parts.join('\n');
};

export const useMentionCommentSync = (rows: ChecklistTableRow[], setRows: SetRows) => {
  const prevTextRef = useRef<string>('');
  const [testRequestTags, setTestRequestTags] = useState<string[]>([]);

  useEffect(() => {
    const text = buildMentionCommentText(rows, testRequestTags);
    if (prevTextRef.current === text) return;
    prevTextRef.current = text;

    document.dispatchEvent(new CustomEvent('richchat:set', { detail: { text } }));
  }, [rows, testRequestTags]);

  useEffect(() => {
    const onChange = (e: Event) => setTestRequestTags((e as CustomEvent<TestRequestChangeDetail>).detail?.tags ?? []);
    document.addEventListener(TEST_REQUEST_CHANGE_EVENT, onChange);
    return () => document.removeEventListener(TEST_REQUEST_CHANGE_EVENT, onChange);
  }, []);

  useEffect(() => {
    const clearMentionSelection = () => {
      setTestRequestTags([]);
      setRows(prevRows =>
        prevRows.map(row => {
          if (getStatusValue(row, COLUMN_IDS.TRANSLATIONS) !== 2) return row;

          const cleared = 0 as ChecklistStatus;
          const nextRow: ChecklistTableRow = { ...row, columnStatuses: { ...(row.columnStatuses ?? {}) } };
          nextRow.columnStatuses[COLUMN_IDS.TRANSLATIONS] = cleared;
          nextRow.translations = cleared;
          return nextRow;
        }),
      );
    };

    document.addEventListener('richchat:sent', clearMentionSelection);
    return () => document.removeEventListener('richchat:sent', clearMentionSelection);
  }, [setRows]);
};
