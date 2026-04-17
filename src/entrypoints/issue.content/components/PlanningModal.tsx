import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';

import { getShopIdsMap } from '@/entrypoints/newtab/utils/planning/getShopIdsMap';
import { useNewsletterTitle } from '@/entrypoints/newtab/utils/planning/hooks/useNewsletterTitle';
import { PlanningModalProps } from '@/entrypoints/newtab/types/Planning';
import { usePlanning } from '@/entrypoints/newtab/utils/planning/hooks/usePlanning';
import {
  formatResultsForClipboard,
  getSuccessfulCount,
  getTotalCustomers,
} from '@/entrypoints/newtab/utils/planning/resultHelpers';
import { ProgressSection } from './planningmodal/ProgressSection';
import { ResultsTable } from './planningmodal/ResultsTable';
import { ModalHeader } from './planningmodal/ModalHeader';
import { ActionButtons } from './planningmodal/ActionButtons';

const PlanningModal = ({ issueId, chdeId, onClose, onSuccess, tableData, isABTesting }: PlanningModalProps) => {
  const { newsletterTitle, loading: newsletterTitleLoading, error: newsletterTitleError } = useNewsletterTitle(issueId);
  const newsletterIdMap = useMemo(
    () => (tableData && chdeId ? getShopIdsMap(tableData, parseInt(chdeId, 10)) : new Map()),
    [tableData, chdeId],
  );

  const { loading, error, progress, results, showResults, executePlanning, cancelPlanning, setShowResults, setError } =
    usePlanning(newsletterIdMap);

  const handlePlanning = async () => {
    if (!chdeId) {
      setError('CHDE ID not found in table data.');
      return;
    }

    await executePlanning();
    onSuccess?.();
  };

  const handleClose = () => {
    if (loading) {
      const confirmClose = window.confirm('Planning is still in progress. Are you sure you want to close?');
      if (!confirmClose) {
        return;
      }
    }
    cancelPlanning();
    onClose();
  }

  const handleCancel = () => {
    cancelPlanning();
  }

  const copyResultsToClipboard = () => {
    const text = formatResultsForClipboard(results);
    void navigator.clipboard.writeText(text);
  };

  const totalCustomers = getTotalCustomers(results);
  const successfulCount = getSuccessfulCount(results);

  const displayError = error || newsletterTitleError;

  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={handleClose}>
      <div className={clsx(formStyles.modal)} onClick={e => e.stopPropagation()}>
        <ModalHeader title={showResults ? 'Planning Results' : 'Start Planning'} onClose={handleClose} />

        <div className={formStyles.modalContent}>
          {displayError ? <div className={clsx(formStyles.error, formStyles.formError)}>{displayError}</div> : null}

          {!showResults ? (
            <>
              <ProgressSection
                newsletterTitle={newsletterTitle}
                newsletterTitleLoading={newsletterTitleLoading}
                chdeId={chdeId}
                isABTesting={isABTesting}
                progress={progress}
                results={results}
              />

              <ActionButtons
                mode="planning"
                loading={loading || newsletterTitleLoading}
                onPrimaryClick={() => void handlePlanning()}
                onSecondaryClick={loading ? handleCancel : onClose}
                primaryLabel={loading ? 'Planning...' : 'Start Planning'}
              />
            </>
          ) : (
            <>
              <ResultsTable
                results={results}
                totalCustomers={totalCustomers}
                successfulCount={successfulCount}
                totalShops={results.length}
              />

              <ActionButtons
                mode="results"
                onPrimaryClick={() => {
                  setShowResults(false);
                  onSuccess?.();
                  onClose();
                }}
                onSecondaryClick={() => {
                  setShowResults(false);
                  onSuccess?.();
                  onClose();
                }}
                primaryLabel="Close"
                secondaryLabel=""
                showCopyButton
                onCopyClick={copyResultsToClipboard}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningModal;
