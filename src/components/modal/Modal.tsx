import { useEffect, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import styles from './Modal.module.scss';

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
};

const Modal = ({ isOpen, onClose, title, children, width, height, maxWidth, maxHeight }: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalStyle: CSSProperties = {
    ['--modal-width' as string]: width ?? '500px',
    ['--modal-height' as string]: height ?? 'auto',
    ['--modal-max-width' as string]: maxWidth ?? '94vw',
    ['--modal-max-height' as string]: maxHeight ?? '92vh',
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={modalStyle} onClick={event => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <Icon icon="mdi:close" width="18" height="18" />
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
