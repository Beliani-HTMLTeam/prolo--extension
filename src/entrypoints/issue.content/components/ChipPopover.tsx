import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from '../styles/layout.module.scss';

type ChipPopoverProps = {
  trigger: ReactNode;
  title?: string;
  wide?: boolean;
  children: ReactNode;
};

// chip that opens a floating panel under it, so extra info doesn't push the layout down
const ChipPopover = ({ trigger, title, wide = false, children }: ChipPopoverProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.popoverRoot} ref={rootRef}>
      <button
        type="button"
        className={`${styles.linkChip} ${open ? styles.linkChipActive : ''}`}
        title={title}
        onClick={() => setOpen(value => !value)}
      >
        {trigger}
      </button>
      {open && <div className={`${styles.popoverPanel} ${wide ? styles.popoverPanelWide : ''}`}>{children}</div>}
    </div>
  );
};

export default ChipPopover;
