import { PlanningResultsActionsProps } from '@/entrypoints/issue.content/types/Planning';
import Skeleton from 'react-loading-skeleton';

import styles from '../../styles/planning.module.scss';

import PlanningButton from './PlanningButton';

export const PlanningResultsActions = ({
  loading,
  planningStarted,
  showResults,
  totalCustomers,
  aggregating,
  onCopyResults,
}: PlanningResultsActionsProps) => {
  const planningFinished = !loading && planningStarted && showResults;

  return (
    <div className={styles.results}>
      {planningFinished && (
        <>
          <PlanningButton isPrimary={true} onClick={onCopyResults} icon="mdi:content-copy" label="Copy Results" />

          <PlanningButton
            isPrimary={false}
            onClick={() => {
              window.open(
                'https://docs.google.com/spreadsheets/d/1prLX1zu8-5NPN49gcdcRSSNluiYELaAYC7YjLTfXYC0',
                '_blank',
              );
            }}
            label="Open QA Sheet"
          />
          <PlanningButton
            isPrimary={false}
            onClick={() => {
              window.open(
                'https://www.prologistics.info/spam_plan.php',
                '_blank',
              );
            }}
            label="Open Spam Plan"
          />
        </>
      )}

      {planningStarted && showResults && (
        <div className={styles.totalCustomers}>
          Total: {aggregating ? <Skeleton width={80} /> : totalCustomers.toLocaleString()}
        </div>
      )}
    </div>
  );
};
