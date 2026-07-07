import styles from '../../styles/updater.module.scss';
import { UpdaterButtonsProps } from '@/entrypoints/issue.content/types/Updater';
import UpdaterButton from './UpdaterButton';
import { Icon } from '@iconify/react';

const UpdaterButtons = ({
  updateStarted,
  selectedSLCount,
  selectedPTCount,
  onUpdateAllSL,
  onUpdateSelectedSL,
  onUpdateAllPT,
  onUpdateSelectedPT,
  onUpdateSelected,
  onUpdateAll,
  onSelectAll,
  onClearAll,
  onCancel,
  onVerify,
  verifying = false,
  hasVerified = false,
  verifyProgress = { completed: 0, total: 0 },
}: UpdaterButtonsProps) => {
  const isUpdating = updateStarted;
    const hasAnySelections = selectedSLCount > 0 || selectedPTCount > 0;


  return (
    <>
      <div className={styles.actionButtons}>
        <UpdaterButton
          isPrimary={false}
          onClick={onVerify}
          disabled={isUpdating || verifying}
          icon={verifying ? 'svg-spinners:180-ring' : 'mdi:check-circle-outline'}
          label={verifying ? 'Verifying...' : hasVerified ? 'Verified ✓' : 'Verify'}
        />

        {verifying && verifyProgress.total > 0 && (
          <div className={styles.verifyProgress}>
            <span className={styles.verifyProgressText}>
              {verifyProgress.completed}/{verifyProgress.total}
            </span>
            <div className={styles.verifyProgressBar}>
              <div 
                className={styles.verifyProgressFill}
                style={{ width: `${(verifyProgress.completed / verifyProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {hasVerified && !verifying && (
          <div className={styles.verifyStatus}>
            <Icon icon="mdi:check-circle" width="14" height="14" className={styles.verifyStatusIcon} />
            <span>All verified</span>
          </div>
        )}

        <div className={styles.divider} />
        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateAll}
          disabled={isUpdating}
          icon="mdi:send"
          label='Update All'
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateAllSL}
          disabled={isUpdating}
          icon="mdi:send-check"
          label='Update All SL'
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateAllPT}
          disabled={isUpdating}
          icon="mdi:send-check"
          label='Update All PT'
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateSelectedSL}
          disabled={isUpdating || selectedSLCount === 0}
          icon="mdi:send-check"
          label='Update Selected SL'
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateSelectedPT}
          disabled={isUpdating || selectedPTCount === 0}
          icon="mdi:send-check"
          label='Update Selected PT'
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateSelected}
          disabled={isUpdating || !hasAnySelections}
          label='Update Selected'
        />

        <UpdaterButton
          isPrimary={false}
          onClick={onSelectAll}
          disabled={isUpdating}
          label='Select All Ready'
        />

        <UpdaterButton
          isPrimary={false}
          onClick={onClearAll}
          disabled={isUpdating || !hasAnySelections}
          label='Clear All'
        />
      </div>

      {isUpdating && <UpdaterButton isPrimary={false} onClick={onCancel} label="Cancel" />}
    </>
  );
};

export default UpdaterButtons;
