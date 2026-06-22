import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './Overlay.module.scss';

type OverlayProps = {
  visible?: boolean;
  className?: string;
  children: ReactNode;
};

const Overlay = ({ visible = true, className, children }: OverlayProps) => {
  return <div className={clsx(styles.overlay, visible ? styles.visible : styles.hidden, className)}>{children}</div>;
};

export default Overlay;
