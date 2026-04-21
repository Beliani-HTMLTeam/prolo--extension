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
import { NewsletterSelector } from './planningmodal/NewsletterSelector';
import { isSlugReadyForPlanning } from '@/entrypoints/newtab/utils/planning/isSlugReadyForPlanning';
import { SLUG_ID_MAP } from '../lib/planningConfig';

const normalizeSlugForSlug = (slug: string): string => {
  const NORMALIZATION: Record<string, string> = {
    'ES': 'SP'
  };
  return NORMALIZATION[slug] || slug;
}

const PlanningModal = ({ issueId, chdeId, onClose, onSuccess, tableData, isABTesting }: PlanningModalProps) => {
  const { newsletterTitle, loading: newsletterTitleLoading, error: newsletterTitleError } = useNewsletterTitle(issueId);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [useAllSlugs, setUseAllSlugs] = useState(true);

  const availableSlugs = useMemo(() => {
    if (!tableData?.rows) return [];
    return tableData.rows.map(r => r.shop).filter(Boolean);
  }, [tableData]);

  const filteredNewsletterIdMap = useMemo(() => {
    const fullMap = tableData && chdeId ? getShopIdsMap(tableData, parseInt(chdeId, 10)) : new Map();

    if (useAllSlugs || selectedSlugs.size === 0) {
      return fullMap;
    }

    const filteredMap = new Map();

    for (const [mapKey, ids] of fullMap.entries()) {
     const isSelected = Array.from(selectedSlugs).some(selected => {
      const normalizedSelected = normalizeSlugForSlug(selected);
      return normalizedSelected === mapKey;
     })

     if(isSelected) {
      filteredMap.set(mapKey, ids);
     }
    }
    return filteredMap;
  }, [tableData, chdeId, useAllSlugs, selectedSlugs]);

  const displaySlugs = useMemo(() => {
    if (!tableData?.rows) return [];
    return tableData.rows.map(r => ({
      display: r.shop,
      normalize: normalizeSlugForSlug(r.shop)
    }))
  }, [tableData]);

  console.log('newsletterIdMap keys:', Array.from(filteredNewsletterIdMap.keys()));
console.log('SLUG_ID_MAP keys:', Object.keys(SLUG_ID_MAP));

  const { loading, error, progress, results, showResults, executePlanning, cancelPlanning, setShowResults, setError } =
    usePlanning(filteredNewsletterIdMap);

  const handlePlanning = async () => {
    if (!chdeId) {
      setError('CHDE ID not found in table data.');
      return;
    }

    if (!useAllSlugs && selectedSlugs.size === 0) {
      setError('Please select at least one newsletter to plan.');
      return;
    }

    if (useAllSlugs) {
      const allReady = availableSlugs.every(slug =>
        isSlugReadyForPlanning(tableData || null, slug, isABTesting || false),
      );

      if (!allReady) {
        setError(
          'Cannot plan all newsletters. Some require approval (LP or NSLT). Please select specific newsletters instead.',
        );
        return;
      }
    }

    if (!useAllSlugs) {
      const invalidSlugs = Array.from(selectedSlugs).filter(
        slug => !isSlugReadyForPlanning(tableData || null, slug, isABTesting || false),
      );

      if (invalidSlugs.length > 0) {
        setError(
          `Cannot plan ${invalidSlugs.join(', ')} ${invalidSlugs.length === 1 ? 'requires' : 'require'} approval (LP or NSLT).`,
        );
        return;
      }
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
  };

  const toggleSlug = (slug: string) => {
    const newSelected = new Set(selectedSlugs);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedSlugs(newSelected);
  };

  const addSlug = (slug: string) => {
    setSelectedSlugs(prev => new Set([...prev, slug]));
  };

  const removeSlug = (slug: string) => {
    setSelectedSlugs(prev => {
      const newSet = new Set(prev);
      newSet.delete(slug);
      return newSet;
    });
  };

  const clearAll = () => {
    setSelectedSlugs(new Set());
  };

  const handleCancel = () => {
    cancelPlanning();
  };

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

              <NewsletterSelector
                availableSlugs={availableSlugs}
                selectedSlugs={selectedSlugs}
                useAllSlugs={useAllSlugs}
                onUseAllChange={setUseAllSlugs}
                onToggleSlug={toggleSlug}
                onAddSlug={addSlug}
                onRemoveSlug={removeSlug}
                onClearAll={clearAll}
                isABTesting={isABTesting || false}
                tableData={tableData || null}
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
