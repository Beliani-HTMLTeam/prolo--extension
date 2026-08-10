import styles from '../push.module.scss';

type OverlayToggleButtonProps = {
  onClick: () => void;
};

export const OverlayToggleButton = ({ onClick }: OverlayToggleButtonProps) => {
  return (
    <button onClick={onClick} className={styles.overlayToggleButton}>
      📊 Dashboard
    </button>
  );
};