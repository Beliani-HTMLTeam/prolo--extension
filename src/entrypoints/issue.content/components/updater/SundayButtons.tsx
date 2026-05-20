import styles from '../../styles/sunday.module.scss';
import UpdaterButton from './UpdaterButton';

interface SundayButtonsProps {
  hasSelection: boolean;
  onUpdate: () => void;
  onClear: () => void;
  loading: boolean;
}

export const SundayButtons = ({ hasSelection, onUpdate, onClear, loading }: SundayButtonsProps) => {
const isUpdating = loading;

  return (
    <div className={styles.sundayButtons}>
      <UpdaterButton
        isPrimary={true}
        onClick={onUpdate}
        disabled={!hasSelection || isUpdating}
        icon="mdi:send"
        label={isUpdating ? 'Updating...' : 'Update Selected Subject Line'}
      />

      <UpdaterButton
        isPrimary={false}
        onClick={onClear}
        disabled={!hasSelection || isUpdating}
        icon="mdi:close"
        label="Clear Selection"
      />
    </div>
  );
}
