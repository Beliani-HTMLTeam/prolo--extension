import styles from '../../styles/FamilyTable.module.scss';
import { Icon } from '@iconify/react';
import { getLinkUrl, getLinkValue } from './cellHelpers';
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

export const TableHeaders = ({ columns, rows }: TableHeadersProps) => {
  return columns.map(column => {
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
        title={isClickable ? `Click to open all ${column.label} links` : ''}
      >
        {column.label}
        {isClickable && <Icon icon="charm:link-external" width="12" height="12" style={{ marginLeft: '2px' }} />}
      </div>
    );
  });
};
