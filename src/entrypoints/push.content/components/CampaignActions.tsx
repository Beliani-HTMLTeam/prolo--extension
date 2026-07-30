import styles from '../push.module.scss';

type CampaignActionsProps = {
  isRandomTesting: boolean;
  isSendingAll: boolean;
  hasCampaignData: boolean;
  onTest3Random: () => void;
  onSendAll: () => void;
};

export const CampaignActions = ({
  isRandomTesting,
  isSendingAll,
  hasCampaignData,
  onTest3Random,
  onSendAll,
}: CampaignActionsProps) => {
  return (
    <div className={styles.campaignActions}>
      <button
        onClick={onTest3Random}
        disabled={isRandomTesting || isSendingAll || !hasCampaignData}
        className={styles.btnTestRandom}
      >
        {isRandomTesting ? 'Testing 3 Random...' : '🚀 Test 3 Random'}
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