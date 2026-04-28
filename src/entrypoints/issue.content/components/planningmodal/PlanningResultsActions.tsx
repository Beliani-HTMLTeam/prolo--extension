import { PlanningResultsActionsProps } from '@/entrypoints/newtab/types/Planning';
import Skeleton from 'react-loading-skeleton';
import formStyles from '../../styles/forms.module.scss';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import planningStyles from '../../styles/planning.module.scss';

export const PlanningResultsActions = ({
  loading,
  planningStarted,
  showResults,
  totalCustomers,
  aggregating,
  onCopyResults,
  onClose,
}: PlanningResultsActionsProps) => (
  <>
    {!loading && planningStarted && showResults && (
      <div className={formStyles.modalButtons} style={{ marginTop: '16px' }}>
        <button className={clsx(formStyles.btn, formStyles['btn--primary'])} onClick={onCopyResults}>
          <Icon icon="mdi:content-copy" width="14" height="14" />
          Copy Results
        </button>
        <button className={clsx(formStyles.btn, formStyles['btn--ghost'])} onClick={onClose}>
          Close
        </button>
      </div>
    )}
    {planningStarted && showResults && (
        <div className={planningStyles.totalCustomers}>
          Total: {aggregating ? <Skeleton width={80} /> : totalCustomers.toLocaleString()}
        </div>
    )}
  </>
);
