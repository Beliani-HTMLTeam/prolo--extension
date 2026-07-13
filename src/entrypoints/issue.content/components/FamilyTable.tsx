import { useEffect, useState } from 'react';
import styles from '../styles/FamilyTable.module.scss';
import { shopToMentionTagMap } from '../lib/shopMaps';
import { COLUMN_IDS } from '../api/checklistShared';
import type { ChecklistOwner, ChecklistTableData, ChecklistTableRow } from '../lib/types';
import { TableHeaders } from './familytable/TableHeaders';
import { TableRows } from './familytable/TableRows';

type FamilyTableProps = {
  data: ChecklistTableData;
  owner: ChecklistOwner | null;
};

//     const owner = getChecklistOwner(parsed.issueTypes);

const FamilyTable = ({ data, owner }: FamilyTableProps) => {
  const [rows, setRows] = useState<ChecklistTableRow[]>(data.rows);
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);    

  useEffect(() => {
    setRows(data.rows);
  }, [data.rows]);

  const columns = data.columns;

  useEffect(() => {
    const hasTranslations = columns.some(column => column.id === COLUMN_IDS.TRANSLATIONS);
    const hasTestRequest = columns.some(column => column.id === COLUMN_IDS.TEST_REQUEST);
    if (!hasTranslations && !hasTestRequest) {
      return;
    }

    const translationTags = new Set<string>();
    const testRequestTags = new Set<string>();

    rows.forEach(row => {
      if ((row.columnStatuses?.[COLUMN_IDS.TRANSLATIONS] ?? row.translations) === 2) {
        const mentionTag = shopToMentionTagMap[row.shop];
        if (mentionTag) {
          translationTags.add(mentionTag);
        }
      }

      if ((row.columnStatuses?.[COLUMN_IDS.TEST_REQUEST] ?? row.testRequest) === 2) {
        const mentionTag = shopToMentionTagMap[row.shop];
        if (mentionTag) {
          testRequestTags.add(mentionTag);
        }
      }
    });

    let commentText = '';

    if (translationTags.size > 0) {
      commentText += `${Array.from(translationTags).join(' ')} please translate :)\n`;
    }

    if (testRequestTags.size > 0) {
      commentText += `${Array.from(testRequestTags).join(' ')} please test :)`;
    }

    document.dispatchEvent(new CustomEvent('richchat:set', { detail: { text: commentText.trim() } }));
  }, [rows, columns]);

  return (
    <div className={styles.familyTable} style={{ gridTemplateColumns: `repeat(${columns.length}, auto)` }}>
      <TableHeaders columns={columns} rows={rows} />
      <TableRows
        columns={columns}
        rows={rows}
        setRows={setRows}
        hoveredShop={hoveredShop}
        setHoveredShop={setHoveredShop}
        checklistOwner={owner}
      />
    </div>
  );
};

export default FamilyTable;
