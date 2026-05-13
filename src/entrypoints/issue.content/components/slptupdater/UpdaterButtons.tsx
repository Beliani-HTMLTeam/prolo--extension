import styles from '../../styles/updater.module.scss';
import { UpdaterButtonsProps } from '@/entrypoints/newtab/types/Updater';
import UpdaterButton from './UpdaterButton';

const UpdaterButtons = ({
  loading,
  updateStarted,
  readyCount,
  selectedCount,
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
  return (
    <>
      <div className={styles.actionButtons}>
        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateAll}
          disabled={loading || updateStarted || hasManualSelection}
          icon="mdi:send"
          label="Update All"
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateAllSL}
          disabled={loading || updateStarted || hasManualSelection}
          icon="mdi:send-check"
          label={`Update All SL`}
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateAllPT}
          disabled={loading || updateStarted || hasManualSelection}
          icon="mdi:send-check"
          label={`Update All PT`}
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateSelectedSL}
          disabled={loading || selectedCount === 0 || updateStarted}
          icon="mdi:send-check"
          label={`Update Selected SL`}
        />

        <UpdaterButton
          isPrimary={true}
          onClick={onUpdateSelectedPT}
          disabled={loading || selectedCount === 0 || updateStarted}
          icon="mdi:send-check"
          label={`Update Selected PT`}
        />

        <UpdaterButton
          isPrimary={false}
          onClick={onSelectAll}
          disabled={loading || updateStarted}
          label="Select All Ready"
        />

        <UpdaterButton
          isPrimary={false}
          onClick={onClearAll}
          disabled={loading || updateStarted || selectedCount === 0}
          label="Clear All"
        />
      </div>

      {loading && updateStarted && <UpdaterButton isPrimary={false} onClick={onCancel} label="Cancel" />}
    </>
  );
};

export default UpdaterButtons;
