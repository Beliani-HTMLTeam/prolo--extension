import { useEffect, useState } from 'react';
import styles from '../styles/FamilyTable.module.scss';
import { TableHeaders } from './familytable/TableHeaders';
import { TableRows } from './familytable/TableRows';
import { shopToMentionTagMap } from '../lib/shopMaps';
import type { ChecklistTableData, ChecklistTableRow } from '../lib/types';

type FamilyTableProps = {
  data: ChecklistTableData;
};

const FamilyTable = ({ data }: FamilyTableProps) => {
  const [rows, setRows] = useState<ChecklistTableRow[]>(data.rows);
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);

  useEffect(() => {
    setRows(data.rows);
  }, [data.rows]);

  const headers = data.headers;

  useEffect(() => {
    if (!headers.includes('Translations') && !headers.includes('Test Request')) {
      return;
    }

    const translationTags = new Set<string>();
    const testRequestTags = new Set<string>();

    rows.forEach(row => {
      if (row.translations === 2) {
        const mentionTag = shopToMentionTagMap[row.shop];
        if (mentionTag) {
          translationTags.add(mentionTag);
        }
      }

      if (row.testRequest === 2) {
        const mentionTag = shopToMentionTagMap[row.shop];
        if (mentionTag) {
          testRequestTags.add(mentionTag);
        }
      }
    });

    let commentText = '';

    if (translationTags.size > 0) {
      commentText += `${Array.from(translationTags).join(' ')} please translate!\n`;
    }

    if (testRequestTags.size > 0) {
      commentText += `${Array.from(testRequestTags).join(' ')} please test :)`;
    }

    document.dispatchEvent(new CustomEvent('richchat:set', { detail: { text: commentText.trim() } }));
  }, [rows]);

  return (
    <div className={styles.familyTable} style={{ gridTemplateColumns: `repeat(${headers.length}, auto)` }}>
      <TableHeaders headers={headers} rows={rows} />
      <TableRows
        headers={headers}
        rows={rows}
        setRows={setRows}
        hoveredShop={hoveredShop}
        setHoveredShop={setHoveredShop}
      />
    </div>
  );
};

export default FamilyTable;
