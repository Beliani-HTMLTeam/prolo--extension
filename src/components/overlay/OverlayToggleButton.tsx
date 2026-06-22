import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Overlay.module.scss';

type OverlayToggleButtonProps = {
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const OverlayToggleButton = ({
  children = 'Dashboard',
  className,
  type = 'button',
  ...props
}: OverlayToggleButtonProps) => {
  return (
    <button type={type} className={clsx(styles.toggleButton, className)} {...props}>
      {children}
    </button>
  );
};

export default OverlayToggleButton;
