import styles from '../../styles/FamilyTable.module.scss';
import { Icon } from '@iconify/react';
import { getShopId } from '../../lib/shopIdMap';
import type { ChecklistColumn, ChecklistTableRow } from '../../lib/types';
import { COLUMN_IDS } from '../../api/checklistShared';

type TableHeadersProps = {
  columns: ChecklistColumn[];
  rows: ChecklistTableRow[];
};

const getLinkValue = (row: ChecklistTableRow, columnId: string): string | null => {
  const fromColumnMap = row.columnValues?.[columnId];
  if (fromColumnMap) {
    return fromColumnMap;
  }

  if (columnId === COLUMN_IDS.NSLT_ID) return row.nsltId;
  if (columnId === COLUMN_IDS.NSLT_A_ID) return row.nsltAId;
  if (columnId === COLUMN_IDS.NSLT_B_ID) return row.nsltBId;
  if (columnId === COLUMN_IDS.LP_ID) return row.lpId;
  if (columnId === COLUMN_IDS.LP_A_ID) return row.lpAId;
  if (columnId === COLUMN_IDS.LP_B_ID) return row.lpBId;
  return null;
};

const openAllLinksFromColumn = (column: ChecklistColumn, rows: ChecklistTableRow[]) => {
  if (column.kind !== 'link') {
    return;
  }

  const domain = window.location.origin;
  const urls: string[] = [];

  rows.forEach(row => {
    const id = getLinkValue(row, column.id);
    if (!id) {
      return;
    }

    if (column.id === COLUMN_IDS.LP_ID) {
      const shopId = getShopId(row.shop);
      if (!shopId) {
        return;
      }
      urls.push(`${domain}/shop_content.php?id=${id}&shop_id=${shopId}`);
      return;
    }
    if (column.id === COLUMN_IDS.LP_A_ID || column.id === COLUMN_IDS.LP_B_ID) {
      const shopId = getShopId(row.shop);
      if (!shopId) {
        return;
      }
      urls.push(`${domain}/shop_content.php?id=${id}&shop_id=${shopId}`);
    }

    if (column.id === COLUMN_IDS.NSLT_ID || column.id === COLUMN_IDS.NSLT_A_ID || column.id === COLUMN_IDS.NSLT_B_ID) {
      urls.push(`${domain}/news_email.php?id=${id}`);
    }
  });

  // Open all URLs in new tabs
  urls.forEach(url => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
