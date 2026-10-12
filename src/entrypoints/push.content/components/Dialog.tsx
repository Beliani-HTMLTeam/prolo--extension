import { type ReactNode, useEffect } from 'react';
import styles from '../push.module.scss';

export type DialogVariant = 'confirm' | 'success';

export interface DialogProps {
  isOpen: boolean;
  variant?: DialogVariant;
  title: string;
  message?: ReactNode;
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
  const isSuccess = variant === 'success';

  // Escape = Cancel (confirm dialog) / OK (success dialog). Never confirms a send.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isSuccess) onClose?.();
      onCancel?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isSuccess, onCancel, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose?.();
    onCancel?.();
  };

  return (
    <div className={styles.confirmationOverlay}>
      <div className={styles.confirmationDialog} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.confirmationIcon}>{isSuccess ? '✅' : '📤'}</div>

        <h3 className={styles.confirmationTitle}>{title}</h3>

        {message && <p className={styles.confirmationText}>{message}</p>}

        <div className={styles.confirmationActions}>
          {isSuccess ? (
            <button
              type="button"
              onClick={handleClose}
              className={`${styles.confirmationBtn} ${styles.confirmationBtnConfirm}`}
              autoFocus
            >
              OK
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                className={`${styles.confirmationBtn} ${styles.confirmationBtnCancel}`}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
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
