import clsx from 'clsx';
import styles from '../../styles/layout.module.scss';

type OverlayProps = {
  visible?: boolean;
  children: React.ReactNode;
};

const Overlay = ({ visible = true, children }: OverlayProps) => {
  return <div className={clsx(visible ? styles.visible : styles.hidden, styles.overlay)}>{children}</div>;
};

export default Overlay;
