import clsx from 'clsx';
import { Icon } from '@iconify/react';
import styles from '../../../styles/FamilyTable.module.scss';
import { COLUMN_IDS } from '../../../api/checklistShared';
import { getStatusValue } from '../cellHelpers';
import type { ChecklistTableRow } from '../../../lib/types';

type ShopCellProps = {
  row: ChecklistTableRow;
  canEdit: boolean;
  onToggleTestSent: (columnId: string, shop: string) => void;
};

export const ShopCell = ({ row, canEdit, onToggleTestSent }: ShopCellProps) => {
  const hasTestSent = !!row.columnCheckpointRefs?.[COLUMN_IDS.TEST_SENT];
  const value = getStatusValue(row, COLUMN_IDS.TEST_SENT);

  if (!hasTestSent) {
    return (
      <span className={styles.shopCell}>
        <span className={clsx(styles.shopChip, styles.shopChipStatic)}>{row.shop}</span>
      </span>
    );
  }

  return (
    <span className={styles.shopCell}>
      <button
        type="button"
        className={clsx(styles.shopChip, value === 1 && styles.shopChipSent, value === 2 && styles.shopChipPending)}
        disabled={!canEdit || value === 2}
        title={value === 1 ? 'Test sent (click to unmark)' : 'Test not sent yet (click to mark as sent)'}
        onClick={() => onToggleTestSent(COLUMN_IDS.TEST_SENT, row.shop)}
      >
        {value === 2 && <Icon icon="svg-spinners:180-ring" width="10" height="10" />}
        {value === 1 && <Icon icon="mdi:check-bold" width="10" height="10" />}
        {row.shop}
      </button>
    </span>
  );
};
