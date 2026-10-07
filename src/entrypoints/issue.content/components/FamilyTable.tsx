import { useEffect, useMemo, useState } from 'react';
import styles from '../styles/FamilyTable.module.scss';
import type { ChecklistOwner, ChecklistTableData, ChecklistTableRow } from '../lib/types';
import { COLUMN_GROUPS } from '../api/checklistShared';
import { TableHeaders } from './familytable/TableHeaders';
import { TableRows } from './familytable/TableRows';
import { ColumnGroupToggle } from './familytable/ColumnGroupToggle';
import { useMentionCommentSync } from './familytable/useMentionCommentSync';
import { useColumnGroupVisibility } from './familytable/useColumnGroupVisibility';

type FamilyTableProps = {
  data: ChecklistTableData;
  owner: ChecklistOwner | null;
};

const FamilyTable = ({ data, owner }: FamilyTableProps) => {
  const [rows, setRows] = useState<ChecklistTableRow[]>(data.rows);
  const [hoveredShop, setHoveredShop] = useState<string | null>(null);
  const { hiddenGroups, toggleGroup } = useColumnGroupVisibility();

  useEffect(() => {
    setRows(data.rows);
  }, [data.rows]);

  const columns = data.columns;
  useMentionCommentSync(rows, columns, setRows);

  const hiddenColumnIds = useMemo(() => {
    const ids = new Set<string>();
    COLUMN_GROUPS.forEach(group => {
      if (hiddenGroups.has(group.key)) group.columnIds.forEach(id => ids.add(id));
    });
    return ids;
  }, [hiddenGroups]);

  const visibleColumns = useMemo(
    () => columns.filter(column => !hiddenColumnIds.has(column.id)),
    [columns, hiddenColumnIds],
  );

  return (
    <>
      <ColumnGroupToggle columns={columns} hiddenGroups={hiddenGroups} onToggle={toggleGroup} />
      <div
        className={styles.familyTable}
        style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, auto)` }}
      >
        <TableHeaders columns={visibleColumns} rows={rows} />
        <TableRows
          columns={visibleColumns}
          rows={rows}
          setRows={setRows}
          hoveredShop={hoveredShop}
          setHoveredShop={setHoveredShop}
          checklistOwner={owner}
        />
      </div>
    </>
  );
};

export default FamilyTable;
