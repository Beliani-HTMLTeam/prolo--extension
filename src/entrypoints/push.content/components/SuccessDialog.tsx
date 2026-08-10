import styles from '../push.module.scss';

type SuccessDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export const SuccessDialog = ({
  isOpen,
  title,
  message,
  onClose,
}: SuccessDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className={styles.successOverlay}>
      <div className={styles.successDialog}>
        <div className={styles.successIcon}>🎉</div>
        <h3 className={styles.successTitle}>{title}</h3>
        <p className={styles.successText}>{message}</p>
        <button
          onClick={onClose}
          className={styles.successBtn}
        >
          OK
        </button>
      </div>
    </div>
  );
};