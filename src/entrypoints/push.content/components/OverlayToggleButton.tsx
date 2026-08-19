import styles from '../push.module.scss';
import { OverlayToggleButtonProps } from '../types/push';

export const OverlayToggleButton = ({ onClick }: OverlayToggleButtonProps) => {
  return (
    <button onClick={onClick} className={styles.overlayToggleButton}>
      Push Dashboard
    </button>
  );
};
