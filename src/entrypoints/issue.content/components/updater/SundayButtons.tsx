import { SundayButtonsProps } from '@/entrypoints/issue.content/types/Updater';
import styles from '../../styles/sunday.module.scss';
import UpdaterButton from './UpdaterButton';


export const SundayButtons = ({ hasSelection, onUpdate, onClear, loading, isUpdating = false }: SundayButtonsProps) => {
  const isDisabled = loading || isUpdating || !hasSelection;

  return (
    <div className={styles.sundayButtons}>
      <UpdaterButton
        isPrimary={true}
        onClick={onUpdate}
        disabled={isDisabled}
        icon="mdi:send"
        label={isUpdating ? 'Updating...' : 'Update Selected Subject Line'}
      />

      <UpdaterButton
        isPrimary={false}
        onClick={onClear}
        disabled={isDisabled}
        icon="mdi:close"
        label="Clear Selection"
      />
    </div>
  );
}
