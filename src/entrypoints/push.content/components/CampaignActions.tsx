import styles from '../push.module.scss';

type CampaignActionsProps = {
  isRandomTesting: boolean;
  isSendingAll: boolean;
  hasCampaignData: boolean;
  testProgress?: { current: number; total: number } | null;
  onTest3Random: () => void;
  onSendAll: () => void;
};

export const CampaignActions = ({
  isRandomTesting,
  isSendingAll,
  hasCampaignData,
  testProgress,
  onTest3Random,
  onSendAll,
}: CampaignActionsProps) => {
   const getTestButtonText = () => {
    if (!isRandomTesting) return '🚀 Test 3 Random';
    if (testProgress) {
      return `Testing ${testProgress.current}/${testProgress.total}...`;
    }
    return 'Testing 3 Random...';
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
        className={styles.btnSendAll}
      >
        {isSendingAll ? 'Sending All...' : '⚠️ Send All'}
      </button>
    </div>
  );
};