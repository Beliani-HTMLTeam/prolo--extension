import clsx from 'clsx';
import styles from '../../styles/FamilyTable.module.scss';
import { COLUMN_GROUPS } from '../../api/checklistShared';
import type { ChecklistColumn } from '../../lib/types';

type ColumnGroupToggleProps = {
  columns: ChecklistColumn[];
  hiddenGroups: Set<string>;
  onToggle: (key: string) => void;
};

export const ColumnGroupToggle = ({ columns, hiddenGroups, onToggle }: ColumnGroupToggleProps) => {
  const columnIds = new Set(columns.map(column => column.id));
  const visibleGroups = COLUMN_GROUPS.filter(group => group.columnIds.some(id => columnIds.has(id)));

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <div className={styles.groupToggleRow}>
      {visibleGroups.map(group => {
        const isHidden = hiddenGroups.has(group.key);
        return (
          <button
            key={group.key}
            type="button"
            className={clsx(styles.groupToggleChip, isHidden && styles.groupToggleChipHidden)}
            onClick={() => onToggle(group.key)}
            title={isHidden ? `Show ${group.label} columns` : `Hide ${group.label} columns`}
          >
            {group.label}
          </button>
        );
      })}
    </div>
  );
};
