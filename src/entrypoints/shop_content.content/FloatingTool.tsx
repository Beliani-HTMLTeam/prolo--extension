import { Icon } from '@iconify/react';
import type { FloatingToolConfig } from './tools';
import styles from './shop_content.module.scss';

export function FloatingTool({ label, loadingLabel, icon, action }: FloatingToolConfig) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  const text = loading && loadingLabel ? loadingLabel : label;

  return (
    <button onClick={handleClick} disabled={loading} className={styles.fab} type="button" aria-label={text}>
      <span className={styles.label}>{text}</span>
      <Icon icon={icon} className={styles.icon} />
    </button>
  );
}
