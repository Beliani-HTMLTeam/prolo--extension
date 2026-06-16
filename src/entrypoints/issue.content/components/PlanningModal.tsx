import { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import planningStyles from '../styles/planning.module.scss';
import { getShopIdsMap } from '@/entrypoints/newtab/utils/planning/getShopIdsMap';
import { useNewsletterTitle } from '@/entrypoints/newtab/utils/planning/hooks/useNewsletterTitle';
import { PlanningModalProps } from '@/entrypoints/newtab/types/Planning';
import { usePlanning } from '@/entrypoints/newtab/utils/planning/hooks/usePlanning';
import { formatResultsForClipboard, getTotalCustomers } from '@/entrypoints/newtab/utils/planning/resultHelpers';
import { ModalHeader } from './planningmodal/ModalHeader';
import { isSlugReadyForPlanning } from '@/entrypoints/newtab/utils/planning/isSlugReadyForPlanning';
import 'react-loading-skeleton/dist/skeleton.css';
import { normalizeSlugForSlug } from '@/entrypoints/newtab/utils/planning/slugNormalization';
import { PlanningTable } from './planningmodal/PlanningTable';
import { PlanningButtons } from './planningmodal/PlanningButtons';
import { PlanningProgress } from './planningmodal/PlanningProgress';
import { PlanningResultsActions } from './planningmodal/PlanningResultsActions';
import Skeleton from 'react-loading-skeleton';
import { NEWSLETTER_SLUGS } from '../lib/planningConfig';

const PlanningModal = ({ issueId, mode, chdeId, onClose, onSuccess, tableData, isABTesting }: PlanningModalProps) => {
  const { newsletterTitle, loading: newsletterTitleLoading, error: newsletterTitleError } = useNewsletterTitle(issueId);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [planningStarted, setPlanningStarted] = useState(false);
  const availableSlugs = useMemo(() => {
    if (!tableData?.rows) return [];

    const originalSlugMap = new Map<string, string>();
    for (const shop of tableData.rows) {
      originalSlugMap.set(normalizeSlugForSlug(shop.shop), shop.shop);
    }

    return Object.values(NEWSLETTER_SLUGS).filter(slug => originalSlugMap.has(slug)).map(slug => originalSlugMap.get(slug)!)
  }, [tableData]);

  const filteredNewsletterIdMap = useMemo(() => {
    const fullMap = tableData && chdeId ? getShopIdsMap(tableData, parseInt(chdeId, 10)) : new Map();

    if (selectedSlugs.size === 0) {
      return fullMap;
    }

    const filteredMap = new Map();

    for (const [mapKey, ids] of fullMap.entries()) {
      const isSelected = Array.from(selectedSlugs).some(selected => {
        const normalizedSelected = normalizeSlugForSlug(selected);
        return normalizedSelected === mapKey;
      });

      if (isSelected) {
        filteredMap.set(mapKey, ids);
      }
    }
    return filteredMap;
  }, [tableData, chdeId, selectedSlugs]);

  const {
    loading,
    aggregating,
    error,
    progress,
    results,
    showResults,
    executePlanning,
    resendNewsletter,
    cancelPlanning,
    setShowResults,
    setError,
  } = usePlanning(filteredNewsletterIdMap);

  const handleSendSelected = async () => {
    if (!chdeId) {
      toast.error('CHDE ID not found in table data.');
      return;
    }

    if (selectedSlugs.size === 0) {
      toast.error('Please select at least one newsletter to plan.');
      return;
    }

    const invalidSlugs = Array.from(selectedSlugs).filter(
      slug => !isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode),
    );

    if (invalidSlugs.length > 0) {
      toast.error(
        `Cannot plan ${invalidSlugs.join(', ')} ${invalidSlugs.length === 1 ? 'requires' : 'require'} approval (LP or NSLT).`,
      );
      return;
    }

    setPlanningStarted(true);
    await executePlanning();
    onSuccess?.();
  };

  const handleSendAll = async () => {
    if (!chdeId) {
      toast.error('CHDE ID not found in table data.');
      return;
    }

    const allSlugs = availableSlugs;
    const allReady = allSlugs.every(slug =>
      isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode),
    );

    if (!allReady) {
      toast.error(
        'Cannot plan all newsletters. Some require approval (LP or NSLT). Please select specific newsletters instead.',
      );
      return;
    }

    setSelectedSlugs(new Set(allSlugs));
    setPlanningStarted(true);
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

  const handleResend = async (slug: string, type: 'A' | 'B') => {
    const failedEntry = results.find(r => r.slug === slug && r.type === type);
    if (!failedEntry) return;

    await resendNewsletter(slug, type);
  };

  const selectAll = () => {
    const selectableSlugs = availableSlugs.filter(slug =>
      isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode),
    );
    setSelectedSlugs(new Set(selectableSlugs));
  };

  const toggleSlug = (slug: string) => {
    setSelectedSlugs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const modalTitle = useMemo(() => {
    if (showResults) return 'Planning Results';
    if (newsletterTitleLoading) return <Skeleton width={600} />;
    return newsletterTitle ? newsletterTitle.split('SL')[0].trim() + ' - CHDE ID: ' + chdeId : 'Start Planning';
  }, [showResults, newsletterTitleLoading, newsletterTitle, chdeId]);

  const clearAll = () => {
    setSelectedSlugs(new Set());
  };

  const copyResultsToClipboard = () => {
    const text = formatResultsForClipboard(results);
    void navigator.clipboard.writeText(text);
  };

  const totalCustomers = getTotalCustomers(results);
  const isReady = (slug: string) => {
    return isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode);
  };

  const hasManualSelection = useMemo(() => {
    if (selectedSlugs.size === 0) return false;

    const selectableSlugs = availableSlugs.filter(slug =>
      isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode),
    );

    const allSelectableSelected = selectableSlugs.length > 0 && selectableSlugs.every(slug => selectedSlugs.has(slug));

    if (allSelectableSelected) return false;

    return selectedSlugs.size > 0;
  }, [selectedSlugs, availableSlugs, tableData, isABTesting, mode]);

  const displayError = error || newsletterTitleError;

  useEffect(() => {
    if (displayError) {
      toast.error(displayError);
    }
  }, [displayError]);

  useEffect(() => {
    if (tableData?.rows) {
      const existingSlugs = new Set(tableData.rows.map(r => r.shop));
      const normalizeExistingSlugs = new Set(Array.from(existingSlugs).map(slug => normalizeSlugForSlug(slug)));
      const allSlugs = Object.values(NEWSLETTER_SLUGS);
      const missingSlugs = allSlugs.filter(slug => !normalizeExistingSlugs.has(slug));

      if (missingSlugs.length > 0) {
        console.log(`Note: These newsletters are not in the checklist and will be omitted: ${missingSlugs.join(', ')}`);
      }
    }
  }, [tableData]);

  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={handleClose}>
      <div className={clsx(planningStyles.modal)} onClick={e => e.stopPropagation()}>
        <ModalHeader title={modalTitle} onClose={handleClose} />

        <div className={planningStyles.modalContent}>
          <div className={planningStyles.menu}>
            <PlanningButtons
              loading={loading}
              planningStarted={planningStarted}
              availableSlugsCount={availableSlugs.length}
              selectedCount={selectedSlugs.size}
              hasManualSelection={hasManualSelection}
              onSendAll={handleSendAll}
              onSendSelected={handleSendSelected}
              onSelectAll={selectAll}
              onClearAll={clearAll}
              onCancel={planningStarted ? () => cancelPlanning() : handleClose}
            />

            <PlanningProgress loading={loading} aggregating={aggregating} progress={progress} />

            <PlanningResultsActions
              loading={loading}
              planningStarted={planningStarted}
              showResults={showResults}
              totalCustomers={totalCustomers}
              aggregating={aggregating}
              onCopyResults={copyResultsToClipboard}
              onClose={() => {
                setPlanningStarted(false);
                setShowResults(false);
                onClose();
              }}
            />
          </div>
          
          <PlanningTable
            availableSlugs={availableSlugs}
            selectedSlugs={selectedSlugs}
            results={results}
            loading={loading}
            planningStarted={planningStarted}
            aggregating={aggregating}
            isReady={isReady}
            onToggleSlug={toggleSlug}
            onResend={handleResend}
          />
        </div>
      </div>
    </div>
  );
};

export default PlanningModal;
