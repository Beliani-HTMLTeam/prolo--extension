import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './Overlay.module.scss';

type TopBarProps = {
  onHide: () => void;
  hideLabel?: string;
  className?: string;
  buttonClassName?: string;
  children?: ReactNode;
};

const TopBar = ({ onHide, hideLabel = 'hide overlay', className, buttonClassName, children }: TopBarProps) => {
  return (
    <div className={clsx(styles.topBar, className)}>
      {children}

      <button type="button" className={clsx(styles.hideButton, buttonClassName)} onClick={onHide}>
        {hideLabel}
      </button>
    </div>
  );
};

export default TopBar;
