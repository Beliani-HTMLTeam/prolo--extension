import { useState } from 'react';
import { Icon } from '@iconify/react';
import styles from './CopyButton.module.scss';
import clsx from 'clsx';

interface CopyButtonProps {
  textToCopy: string;
}

export const CopyButton = ({ textToCopy }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (copied) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    });
  };

  return (
    <button
      className={clsx(styles.copyBtn, copied && styles.copied)}
      onClick={handleCopy}
      title="Click to copy productID"
    >
      <Icon icon={copied ? 'lucide:check' : 'lucide:copy'} width="12" height="12" />
      {copied ? 'Copied!' : 'Copy ID'}
    </button>
  );
};
