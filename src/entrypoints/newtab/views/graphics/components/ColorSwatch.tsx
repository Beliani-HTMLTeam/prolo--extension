import { useState } from 'react';
import { Icon } from '@iconify/react';
import styles from '../styles/ColorSwatch.module.scss';

interface ColorSwatchProps {
  name: string;
  hex: string;
}

export default function ColorSwatch({ name, hex }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.swatchCard}>
      <div className={styles.colorBlock} style={{ backgroundColor: hex }}>
        <div className={styles.copyOverlay} onClick={handleCopy}>
          <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} className={styles.copyIcon} />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </div>
      </div>
      <span className={styles.colorName}>{name}</span>
      <span className={styles.colorHex}>{hex.toUpperCase()}</span>
    </div>
  );
}
