import styles from '../../styles/updater.module.scss';
import { UpdaterButtonsProps } from '@/entrypoints/newtab/types/Updater';
import UpdaterButton from './UpdaterButton';

const UpdaterButtons = ({
  loading,
  updateStarted,
  selectedSLCount,
  selectedPTCount,
  hasManualSelection,
  onUpdateAllSL,
  onUpdateSelectedSL,
  onUpdateAllPT,
  onUpdateSelectedPT,
  onUpdateSelected,
  onUpdateAll,
  onSelectAll,
  onClearAll,
  onCancel,
}: UpdaterButtonsProps) => {
  const isUpdating = loading || updateStarted;

  return (
    <>
      <div className={styles.actionButtons}>
        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateAll}
          disabled={isUpdating || hasManualSelection}
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
          disabled={isUpdating}
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
          disabled={isUpdating || (selectedSLCount === 0 && selectedPTCount === 0)}
          label='Clear All'
        />
      </div>

      {loading && updateStarted && <UpdaterButton isPrimary={false} onClick={onCancel} label="Cancel" />}
    </>
  );
};

export default UpdaterButtons;
