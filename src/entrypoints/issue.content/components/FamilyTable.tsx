import { useEffect, useState } from 'react';
import styles from '../styles/FamilyTable.module.scss';
import type { ChecklistOwner, ChecklistTableData, ChecklistTableRow } from '../lib/types';
import { TableHeaders } from './familytable/TableHeaders';
import { TableRows } from './familytable/TableRows';
import { useMentionCommentSync } from './familytable/useMentionCommentSync';

type FamilyTableProps = {
  data: ChecklistTableData;
  owner: ChecklistOwner | null;
};

const FamilyTable = ({ data, owner }: FamilyTableProps) => {
  const [rows, setRows] = useState<ChecklistTableRow[]>(data.rows);
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);

  useEffect(() => {
    setRows(data.rows);
  }, [data.rows]);

  const columns = data.columns;
  useMentionCommentSync(rows, columns, setRows);

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
