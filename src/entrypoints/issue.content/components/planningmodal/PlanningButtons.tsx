import clsx from 'clsx';
import formStyles from '../../styles/forms.module.scss';
import planningStyles from '../../styles/planning.module.scss';
import { PlanningButtonsProps } from '@/entrypoints/newtab/types/Planning';
import { Icon } from '@iconify/react';

export const PlanningButtons = ({
  loading,
  planningStarted,
  availableSlugsCount,
  selectedCount,
  hasManualSelection,
  onSendAll,
  onSendSelected,
  onSelectAll,
  onClearAll,
  onCancel,
}: PlanningButtonsProps) => (
  <div className={planningStyles.actionButtonsWrapper}>
    <button
      className={clsx(formStyles.btn, formStyles['btn--primary'], planningStyles.btn)}
      onClick={onSendAll}
      disabled={loading || availableSlugsCount === 0 || planningStarted || hasManualSelection}
    >
      <Icon icon="mdi:send" width="16" height="16" />
      Send All
    </button>
    <button
      className={clsx(formStyles.btn, formStyles['btn--primary'], planningStyles.btn)}
      onClick={onSendSelected}
      disabled={loading || selectedCount === 0 || planningStarted}
    >
      <Icon icon="mdi:send-check" width="16" height="16" />
      Send Selected ({selectedCount})
    </button>
    <button
      className={clsx(formStyles.btn, formStyles['btn--ghost'], planningStyles.btn)}
      onClick={onSelectAll}
      disabled={loading || planningStarted}
    >
      Select All Ready
    </button>
    <button
      className={clsx(formStyles.btn, formStyles['btn--ghost'], planningStyles.btn)}
      onClick={onClearAll}
      disabled={loading || planningStarted || selectedCount === 0}
    >
      Clear All
    </button>
    <button
      className={clsx(formStyles.btn, formStyles['btn--ghost'], planningStyles.btn)}
      style={{ marginTop: '25px' }}
      onClick={onCancel}
    >
      Cancel
    </button>
  </div>
);
