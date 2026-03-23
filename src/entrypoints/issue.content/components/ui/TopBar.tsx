import styles from '../../styles/header.module.scss';

type TopBarProps = {
  onHide: () => void;
};

const TopBar = ({ onHide }: TopBarProps) => {
  return (
    <div className={styles.topbar}>
      <button id={styles.hideOverlayButton} onClick={onHide}>
        hide overlay
      </button>
    </div>
  );
};

export default TopBar;
