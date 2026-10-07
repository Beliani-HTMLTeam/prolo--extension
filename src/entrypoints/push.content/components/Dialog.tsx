import styles from '../push.module.scss';

export type DialogVariant = 'confirm' | 'success';

export interface DialogProps {
  isOpen: boolean;
  variant?: DialogVariant;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export const Dialog = ({
  isOpen,
  variant = 'confirm',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
}: DialogProps) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose?.();
    onCancel?.();
  };

  const isSuccess = variant === 'success';

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationDialog}>
        <div className={styles.confirmationIcon}>
          {isSuccess ? '✅' : '📤'}
        </div>

        <h3 className={styles.confirmationTitle}>{title}</h3>

        {message && (
          <p className={styles.confirmationText}>{message}</p>
        )}

        <div className={styles.confirmationActions}>
          {isSuccess ? (
            <button
              onClick={handleClose}
              className={`${styles.confirmationBtn} ${styles.confirmationBtnConfirm}`}
            >
              OK
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                className={`${styles.confirmationBtn} ${styles.confirmationBtnCancel}`}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`${styles.confirmationBtn} ${styles.confirmationBtnConfirm}`}
              >
                {confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};