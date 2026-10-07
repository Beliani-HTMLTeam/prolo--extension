import clsx from 'clsx';
import styles from '../../../styles/FamilyTable.module.scss';
import { StatusIcon } from '../StatusIcon';
import { COLUMN_IDS } from '../../../api/checklistShared';
import { getStatusValue } from '../cellHelpers';
import type { ChecklistStatus, ChecklistTableRow } from '../../../lib/types';

type RequestCellProps = {
  row: ChecklistTableRow;
  columnId: string;
  canEdit: boolean;
  onToggle: (columnId: string, shop: string, currentValue: ChecklistStatus) => void;
};

export const RequestCell = ({ row, columnId, canEdit, onToggle }: RequestCellProps) => {
  const value = getStatusValue(row, columnId);

  if (columnId === COLUMN_IDS.TRANSLATIONS) {
    if (!canEdit) {
      return <StatusIcon status={value} />;
    }

    const label = value === 2 ? 'Cancel' : value === 1 ? '' : 'Request';
    return (
      <button
        onClick={() => onToggle(columnId, row.shop, value)}
        className={clsx(styles.iconButton, { [styles.missing]: value === 0, [styles.pending]: value === 2 })}
        title={value === 2 ? 'Remove Mention' : value === 1 ? '' : 'Mention Translators'}
      >
        <StatusIcon status={value} />
        {label}
      </button>
    );
  }

  if (!canEdit) {
    return <StatusIcon status={0} />;
  }

  const title = value === 2 ? 'Cancel' : 'Request';
  return (
    <button
      onClick={() => onToggle(columnId, row.shop, value)}
      className={value === 2 ? styles.cancelButton : styles.requestButton}
      title={title}
    >
      <StatusIcon
        status={value}
        iconOverride={value === 0 ? 'charm:crosshair' : value === 2 ? 'charm:circle-minus' : undefined}
      />
      {title}
    </button>
  );
};
