import { useEffect } from 'react';
import styles from './purgeDate.module.scss';

type OpenPurgeResult = {
  ok?: boolean;
  status?: number | string;
  [key: string]: unknown;
};

type Props = {
  dateString: string;
  onClose?: () => void;
};

export function PurgeDateBadge({ dateString, onClose }: Props) {
  useEffect(() => {
    const listener = (msg: { action?: string; result?: OpenPurgeResult }) => {
      if (msg.action !== 'openPurgeAndSubmitResult') return;

      const result = msg.result ?? {};
      if (result.ok) {
        console.info('Purge successful:', result.status);
        alert('Purge request completed successfully.');
      } else {
        console.error('Purge failed, unknown result:', result);
        alert('Purge failed. See console for details.');
      }
    };

    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const handleSendToPurge = (e: React.MouseEvent) => {
    e.preventDefault();

    let domain = location.hostname;
    if (domain.startsWith('www.')) {
      domain = domain.slice(4);
    }

    browser.runtime.sendMessage({
      action: 'openPurgeAndSubmit',
      domain,
      urlsValue: location.href,
    });
  };

  return (
    <div className={styles.purgeDate}>
      <div
        className={styles.closeButton}
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') onClose?.();
        }}
      >
        x
      </div>

      <span>Purge Date: {dateString}</span>

      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleSendToPurge}
        >
          Send to Purge
        </button>
      </div>
    </div>
  );
}