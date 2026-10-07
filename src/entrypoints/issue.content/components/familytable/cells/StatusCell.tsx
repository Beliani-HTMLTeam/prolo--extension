import clsx from 'clsx';
import styles from '../../../styles/FamilyTable.module.scss';
import { StatusIcon } from '../StatusIcon';
import { getStatusValue } from '../cellHelpers';
import type { ChecklistTableRow } from '../../../lib/types';

type StatusCellProps = {
  row: ChecklistTableRow;
  columnId: string;
  canEdit: boolean;
  onToggle: (columnId: string, shop: string) => void;
};

export const StatusCell = ({ row, columnId, canEdit, onToggle }: StatusCellProps) => {
  const value = getStatusValue(row, columnId);
  const isInteractive = !!row.columnCheckpointRefs?.[columnId] && canEdit;

  if (!isInteractive) {
    return <StatusIcon status={value} />;
  }

  return (
    <button
      onClick={() => onToggle(columnId, row.shop)}
      className={clsx(styles.iconButton, {
        [styles.done]: value === 1,
        [styles.missing]: !value,
        [styles.pending]: value === 2,
      })}
    >
      <StatusIcon status={value} />
    </button>
  );
};
