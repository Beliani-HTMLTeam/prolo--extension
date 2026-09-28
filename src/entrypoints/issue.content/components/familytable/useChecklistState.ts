import { useCallback } from 'react';
import { mentionToShopsMap, shopToMentionTagMap } from '../../lib/shopMaps';
import type { ChecklistStatus, ChecklistTableRow } from '../../lib/types';
import { COLUMN_IDS } from '../../api/checklistShared';
import { STATUS_FIELD_BY_COLUMN_ID } from './cellHelpers';

type SetRows = React.Dispatch<React.SetStateAction<ChecklistTableRow[]>>;

const setRowStatus = (row: ChecklistTableRow, columnId: string, status: ChecklistStatus): ChecklistTableRow => {
  const statusField = STATUS_FIELD_BY_COLUMN_ID[columnId];
  const nextRow: ChecklistTableRow = {
    ...row,
    columnStatuses: {
      ...(row.columnStatuses ?? {}),
      [columnId]: status,
    },
  };

  if (statusField) {
    (nextRow as unknown as Record<string, ChecklistStatus>)[statusField] = status;
  }

  if (columnId.startsWith('cgb:')) {
    nextRow.cgbStatuses = {
      ...(row.cgbStatuses ?? {}),
      [columnId]: status,
    };
  }

  return nextRow;
};

const saveCheckpointStatus = async (checkpointId: string, checklistId: string, done: boolean) => {
  const issueId = window.location.pathname.split('/').pop();
  const host = window.location.hostname;
  const doneParam = done ? 1 : 0;
  const url = `https://${host}/api/issueLog/saveCheckpoint/?issue_id=${issueId}&checkpoint_id=${checkpointId}&checklist_id=${checklistId}&done=${doneParam}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    });

    const body = await response.text().catch(() => '<no-body>');
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, status: 0, body: String(error) };
  }
};

export const useChecklistState = (rows: ChecklistTableRow[], setRows: SetRows) => {
  const toggleMentionColumn = useCallback(
    (columnId: string, shop: string, currentValue: ChecklistStatus) => {
      if (columnId !== COLUMN_IDS.TRANSLATIONS && columnId !== COLUMN_IDS.TEST_REQUEST) {
        return;
      }

      const mentionTag = shopToMentionTagMap[shop];
      if (!mentionTag) {
        return;
      }

      const shopsInGroup = mentionToShopsMap[mentionTag] ?? [];
      const nextValue: ChecklistStatus = currentValue === 0 ? 2 : currentValue === 2 ? 0 : currentValue;

      setRows(prevRows =>
        prevRows.map(row => {
          if (!shopsInGroup.includes(row.shop)) {
            return row;
          }
          return setRowStatus(row, columnId, nextValue);
        }),
      );
    },
    [setRows],
  );

  const toggleCheckpointColumn = useCallback(
    (columnId: string, shop: string) => {
      const targetRow = rows.find(row => row.shop === shop);
      if (!targetRow) {
        return;
      }

      const ref = targetRow.columnCheckpointRefs?.[columnId];
      if (!ref) {
        return;
      }

      const currentValue = Number(targetRow.columnStatuses?.[columnId] ?? 0) as ChecklistStatus;
      const nextValue: ChecklistStatus = currentValue === 1 ? 0 : 1;

      setRows(prevRows =>
        prevRows.map(row => {
          if (row.shop !== shop) {
            return row;
          }
          return setRowStatus(row, columnId, 2);
        }),
      );

      void saveCheckpointStatus(ref.checkpointId, ref.checklistId, nextValue === 1).then(result => {
        const finalValue: ChecklistStatus = result.ok ? nextValue : currentValue;
        setRows(prevRows =>
          prevRows.map(row => {
            if (row.shop !== shop) {
              return row;
            }
            return setRowStatus(row, columnId, finalValue);
          }),
        );
      });
    },
    [rows, setRows],
  );

  return {
    toggleMentionColumn,
    toggleCheckpointColumn,
  };
};
