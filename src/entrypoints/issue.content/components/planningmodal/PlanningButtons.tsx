import styles from '../../styles/planning.module.scss';
import { PlanningButtonsProps } from '@/entrypoints/issue.content/types/Planning';
import PlanningButton from './PlanningButton';

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
  <>
    <div className={styles.actionButtons}>
      <PlanningButton
        isPrimary={true}
        onClick={onSendAll}
        disabled={loading || availableSlugsCount === 0 || planningStarted || hasManualSelection}
        icon="mdi:send"
        label="Send All"
      />

      <PlanningButton
        isPrimary={true}
        onClick={onSendSelected}
        disabled={loading || selectedCount === 0 || planningStarted}
        icon="mdi:send-check"
        label={`Send Selected (${selectedCount})`}
      />

      <PlanningButton
        isPrimary={false}
        onClick={onSelectAll}
        disabled={loading || planningStarted}
        label="Select All Ready"
      />

      <PlanningButton
        isPrimary={false}
        onClick={onClearAll}
        disabled={loading || planningStarted || selectedCount === 0}
        label="Clear All"
      />
    </div>

    {(loading && planningStarted) && <PlanningButton isPrimary={false} onClick={onCancel} label="Cancel" />}
  </>
);
