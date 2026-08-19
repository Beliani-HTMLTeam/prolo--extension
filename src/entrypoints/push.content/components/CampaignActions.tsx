import styles from '../push.module.scss';
import { CampaignActionsProps } from '../types/push';

export const CampaignActions = ({
  isRandomTesting,
  isSendingAll,
  hasCampaignData,
  testProgress,
  sendAllProgress,
  activeSlug,
  onTest3Random,
  onSendAll,
}: CampaignActionsProps) => {
  const getTestButtonText = () => {
    if (!isRandomTesting) return 'Test 3 Random';
    if (testProgress) {
      return `Testing ${testProgress.current}/${testProgress.total}...: ${activeSlug}`;
    }
    return 'Testing 3 Random...';
  };

  const getSendAllButtonText = () => {
    if (!isSendingAll) return 'Send All';
    if (sendAllProgress) {
      return `Sending ${sendAllProgress.current}/${sendAllProgress.total}...`;
    }
    return 'Sending All...';
  };

  return (
    <div className={styles.campaignActions}>
      <button
        onClick={onTest3Random}
        disabled={isRandomTesting || isSendingAll || !hasCampaignData}
        className={`${styles.btnTestRandom} ${isRandomTesting ? styles.testing : ''}`}
      >
        {getTestButtonText()}
        {isRandomTesting && testProgress && (
          <span className={styles.progressBar}>
            <span
              className={styles.progressFill}
              style={{ width: `${(testProgress.current / testProgress.total) * 100}%` }}
            />
          </span>
        )}
      </button>
      <button
        onClick={onSendAll}
        disabled={isSendingAll || isRandomTesting || !hasCampaignData}
        className={`${styles.btnSendAll} ${isSendingAll ? styles.sending : ''}`}
      >
        {getSendAllButtonText()}
        {isSendingAll && sendAllProgress && (
          <span className={styles.progressBar}>
            <span
              className={styles.progressFill}
              style={{ width: `${(sendAllProgress.current / sendAllProgress.total) * 100}%` }}
            />
          </span>
        )}
      </button>
    </div>
  );
};
