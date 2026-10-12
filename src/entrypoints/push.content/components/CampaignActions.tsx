import { memo } from 'react';
import styles from '../push.module.scss';
import { type CampaignActionsProps } from '../types/push';

type Progress = { current: number; total: number } | null | undefined;

const ProgressBar = ({ progress }: { progress: NonNullable<Progress> }) => (
  <span className={styles.progressBar}>
    <span
      className={styles.progressFill}
      style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
    />
  </span>
);

export const CampaignActions = memo(
  ({
    isRandomTesting,
    isSendingAll,
    hasCampaignData,
    testProgress,
    sendAllProgress,
    activeSlug,
    onTest3Random,
    onSendAll,
  }: CampaignActionsProps) => {
    const disabled = isRandomTesting || isSendingAll || !hasCampaignData;

    const testLabel = !isRandomTesting
      ? 'Test 3 Random'
      : testProgress
        ? `Testing ${testProgress.current}/${testProgress.total}...: ${activeSlug}`
        : 'Testing 3 Random...';

    const sendLabel = !isSendingAll
      ? 'Send All'
      : sendAllProgress
        ? `Sending ${sendAllProgress.current}/${sendAllProgress.total}...`
        : 'Sending All...';

    return (
      <div className={styles.campaignActions}>
        <button
          type="button"
          onClick={onTest3Random}
          disabled={disabled}
          className={`${styles.btnTestRandom} ${isRandomTesting ? styles.testing : ''}`}
        >
          {testLabel}
          {isRandomTesting && testProgress && <ProgressBar progress={testProgress} />}
        </button>
        <button
          type="button"
          onClick={onSendAll}
          disabled={disabled}
          className={`${styles.btnSendAll} ${isSendingAll ? styles.sending : ''}`}
        >
          {sendLabel}
          {isSendingAll && sendAllProgress && <ProgressBar progress={sendAllProgress} />}
        </button>
      </div>
    );
  },
);

CampaignActions.displayName = 'CampaignActions';
