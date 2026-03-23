import styles from '../../styles/FamilyTable.module.scss';
import { Icon } from '@iconify/react';
import { getShopId } from '../../lib/shopIdMap';
import type { ChecklistTableRow } from '../../lib/types';

type TableHeadersProps = {
  headers: string[];
  rows: ChecklistTableRow[];
};

const openAllLinksFromColumn = (header: string, rows: ChecklistTableRow[]) => {
  const isNsltColumn = header.includes('NSLT');
  const isLpColumn = header === 'LP ID';

  if (!isNsltColumn && !isLpColumn) {
    return;
  }

  const domain = window.location.origin;
  const urls: string[] = [];

  rows.forEach(row => {
    let id: string | null = null;

    if (header === 'NSLT ID') {
      id = row.nsltId;
    } else if (header === 'NSLT A ID') {
      id = row.nsltAId;
    } else if (header === 'NSLT B ID') {
      id = row.nsltBId;
    } else if (header === 'LP ID') {
      id = row.lpId;
    }

    if (!id) return;

    let url: string;
    if (isNsltColumn) {
      url = `${domain}/news_email.php?id=${id}`;
    } else {
      const shopId = getShopId(row.shop);
      if (!shopId) return;
      url = `${domain}/shop_content.php?id=${id}&shop_id=${shopId}`;
    }

    urls.push(url);
  });

  // Open all URLs in new tabs
  urls.forEach(url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  });
};

export const TableHeaders = ({ headers, rows }: TableHeadersProps) => {
  const clickableHeaders = ['NSLT ID', 'NSLT A ID', 'NSLT B ID', 'LP ID'];

  return headers.map(key => {
    const isClickable = clickableHeaders.includes(key);

    return (
      <div
        key={key}
        className={styles.headerCell}
        onClick={() => isClickable && openAllLinksFromColumn(key, rows)}
        style={{
          cursor: isClickable ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
        }}
        title={isClickable ? `Click to open all ${key} links` : ''}
      >
        {key}
        {isClickable && <Icon icon="charm:link-external" width="12" height="12" style={{ marginLeft: '2px' }} />}
      </div>
    );
  });
};
