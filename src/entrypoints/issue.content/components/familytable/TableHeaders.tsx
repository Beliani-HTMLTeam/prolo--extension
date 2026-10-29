import styles from '../../styles/FamilyTable.module.scss';
import { COLUMN_IDS } from '../../api/checklistShared';
import { Icon } from '@iconify/react';
import { getLinkUrl, getLinkValue, getStatusValue, isColumnHiddenForRow } from './cellHelpers';
import type { ChecklistColumn, ChecklistTableRow } from '../../lib/types';

type TableHeadersProps = {
  columns: ChecklistColumn[];
  rows: ChecklistTableRow[];
};

const openAllLinksFromColumn = (column: ChecklistColumn, rows: ChecklistTableRow[]) => {
  if (column.kind !== 'link') {
    return;
  }

  rows.forEach(row => {
    const id = getLinkValue(row, column.id);
    if (!id) {
      return;
    }

    const url = getLinkUrl(row, column.id, id);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  });
};

const getColumnProgress = (column: ChecklistColumn, rows: ChecklistTableRow[], isCgbView: boolean) => {
  if (column.kind !== 'status' && column.id !== COLUMN_IDS.TRANSLATIONS) return null;

  const relevant = rows.filter(
    row => row.columnStatuses?.[column.id] !== undefined && !isColumnHiddenForRow(column.id, row, isCgbView),
  );
  if (relevant.length === 0) return null;

  const done = relevant.filter(row => getStatusValue(row, column.id) === 1).length;
  return { done, total: relevant.length };
};

export const TableHeaders = ({ columns, rows }: TableHeadersProps) => {
  const isCgbView = columns.some(column => column.id.startsWith('cgb:'));

  return columns.map(column => {
    const progress = getColumnProgress(column, rows, isCgbView);
    const isClickable = column.kind === 'link' && column.openAllLinks;

    return (
      <div
        key={column.id}
        className={styles.headerCell}
        onClick={() => isClickable && openAllLinksFromColumn(column, rows)}
        style={{
          cursor: isClickable ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
        title={[isClickable && `Click to open all ${column.label} links`, progress && `${progress.done} of ${progress.total} done`]
          .filter(Boolean)
          .join('\n')}
      >
        {column.label}
        {isClickable && <Icon icon="charm:link-external" width="12" height="12" style={{ marginLeft: '2px' }} />}
      </div>
    );
  });
};
