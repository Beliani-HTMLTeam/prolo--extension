import clsx from 'clsx';
import styles from '../../styles/FamilyTable.module.scss';
import { TableCell } from './TableCell';
import { canEditChecklist } from './cellHelpers';
import { useChecklistState } from './useChecklistState';
import type { ChecklistColumn, ChecklistOwner, ChecklistTableRow } from '../../lib/types';
import useTeam from '@/hooks/useTeam';

type TableRowsProps = {
  columns: ChecklistColumn[];
  rows: ChecklistTableRow[];
  setRows: React.Dispatch<React.SetStateAction<ChecklistTableRow[]>>;
  hoveredShop: string | null;
  setHoveredShop: React.Dispatch<React.SetStateAction<string | null>>;
  checklistOwner: ChecklistOwner | null;
};

export const TableRows = ({ columns, rows, setRows, hoveredShop, setHoveredShop, checklistOwner }: TableRowsProps) => {
  const { toggleMentionColumn, toggleCheckpointColumn } = useChecklistState(rows, setRows);
  const { team } = useTeam();
  const isCgbView = columns.some(column => column.id.startsWith('cgb:'));
  const canEdit = canEditChecklist(checklistOwner, team);

  return rows.map(row =>
    columns.map(column => (
      <div
        key={`${column.id}-${row.shop}`}
        className={clsx(styles.dataCell, hoveredShop === row.shop && styles.hovered)}
        data-shop={row.shop}
        onMouseEnter={() => setHoveredShop(row.shop)}
        onMouseLeave={() => setHoveredShop(null)}
      >
        <TableCell
          column={column}
          row={row}
          isCgbView={isCgbView}
          canEdit={canEdit}
          onToggleMention={toggleMentionColumn}
          onToggleCheckpoint={toggleCheckpointColumn}
        />
      </div>
    )),
  );
};
