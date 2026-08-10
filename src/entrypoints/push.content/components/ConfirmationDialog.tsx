import styles from '../push.module.scss';

type ConfirmationDialogProps = {
  isOpen: boolean;
  slug: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmationDialog = ({
  isOpen,
  slug,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) => {
  if (!isOpen) return null;

  console.log('🎯 ConfirmationDialog rendered for:', slug);

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationDialog}>
        <div className={styles.confirmationIcon}>📤</div>
        <h3 className={styles.confirmationTitle}>
          Send {slug.toUpperCase()}?
        </h3>
        <p className={styles.confirmationText}>
          This will send the notification to <strong>{slug.toUpperCase()}</strong>.
        </p>
        <div className={styles.confirmationActions}>
          <button
            onClick={onCancel}
            className={`${styles.confirmationBtn} ${styles.confirmationBtnCancel}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${styles.confirmationBtn} ${styles.confirmationBtnConfirm}`}
          >
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
};