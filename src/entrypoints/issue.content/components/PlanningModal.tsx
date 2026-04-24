import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import planningStyles from '../styles/planning.module.scss';

import { getShopIdsMap } from '@/entrypoints/newtab/utils/planning/getShopIdsMap';
import { useNewsletterTitle } from '@/entrypoints/newtab/utils/planning/hooks/useNewsletterTitle';
import { PlanningModalProps } from '@/entrypoints/newtab/types/Planning';
import { usePlanning } from '@/entrypoints/newtab/utils/planning/hooks/usePlanning';
import { formatResultsForClipboard, getCustomerCount, getStatusDisplay, getSubjectLine, getTotalCustomers } from '@/entrypoints/newtab/utils/planning/resultHelpers';
import { ModalHeader } from './planningmodal/ModalHeader';
import { isSlugReadyForPlanning } from '@/entrypoints/newtab/utils/planning/isSlugReadyForPlanning';
import { Icon } from '@iconify/react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { normalizeSlugForSlug } from '@/entrypoints/newtab/utils/planning/slugNormalization';
import { PlanningTable } from './planningmodal/PlanningTable';
import { PlanningButtons } from './planningmodal/PlanningButtons';


const PlanningModal = ({ issueId, mode, chdeId, onClose, onSuccess, tableData, isABTesting }: PlanningModalProps) => {
  const { newsletterTitle, loading: newsletterTitleLoading, error: newsletterTitleError } = useNewsletterTitle(issueId);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [planningStarted, setPlanningStarted] = useState(false);

  const availableSlugs = useMemo(() => {
    if (!tableData?.rows) return [];
    return tableData.rows.map(r => r.shop).filter(Boolean);
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
    cancelPlanning,
    setShowResults,
    setError,
  } = usePlanning(filteredNewsletterIdMap);

  const handleSendSelected = async () => {
    if (!chdeId) {
      setError('CHDE ID not found in table data.');
      return;
    }

    if (selectedSlugs.size === 0) {
      setError('Please select at least one newsletter to plan.');
      return;
    }

    const invalidSlugs = Array.from(selectedSlugs).filter(
      slug => !isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode),
    );

    if (invalidSlugs.length > 0) {
      setError(
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
      setError('CHDE ID not found in table data.');
      return;
    }

    const allSlugs = availableSlugs;
    const allReady = allSlugs.every(slug =>
      isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode),
    );

    if (!allReady) {
      setError(
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
    if (newsletterTitleLoading) return 'Loading...';
    return newsletterTitle ? newsletterTitle.split('SL')[0].trim() + " - CHDE ID: " + chdeId : 'Start Planning';
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

  const displayError = error || newsletterTitleError;


 

  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={handleClose}>
      <div className={clsx(planningStyles.modal)} onClick={e => e.stopPropagation()}>
        <ModalHeader title={modalTitle} onClose={handleClose} />

        <div className={planningStyles.modalContent}>
          {displayError && <div className={clsx(formStyles.error, formStyles.formError)}>{displayError}</div>}

          {/* Action Buttons Row */}
          <div
            style={{ marginBottom: '20px', minWidth: '200px', display: 'flex', gap: '8px', flexDirection: 'column' }}
          >
           <PlanningButtons
             loading={loading}
             planningStarted={planningStarted}
             availableSlugsCount={availableSlugs.length}
             selectedCount={selectedSlugs.size}
             onSendAll={handleSendAll}
             onSendSelected={handleSendSelected}
             onSelectAll={selectAll}
             onClearAll={clearAll}
             onCancel={planningStarted ? () => cancelPlanning() : handleClose}
           />
            <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
              {loading && (
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                      height: '4px',
                      background: '#4caf50',
                      borderRadius: '2px',
                      transition: 'width 0.3s',
                    }}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {aggregating
                      ? `Fetching customer data... (${progress.current} / ${progress.total})`
                      : `Sending newsletters... (${progress.current} / ${progress.total})`}
                  </div>
                </div>
              )}

              {!loading && planningStarted && showResults && (
                <div className={formStyles.modalButtons} style={{ marginTop: '16px' }}>
                  <button className={clsx(formStyles.btn, formStyles['btn--primary'])} onClick={copyResultsToClipboard}>
                    <Icon icon="mdi:content-copy" width="14" height="14" />
                    Copy Results
                  </button>
                  <button
                    className={clsx(formStyles.btn, formStyles['btn--ghost'])}
                    onClick={() => {
                      setPlanningStarted(false);
                      setShowResults(false);
                      onClose();
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
              {planningStarted && results.length > 0 && (
                <div style={{ position: 'sticky', bottom: 0, background: '#f5f5f5', borderTop: '2px solid #ddd' }}>
                  <tr>
                    <td colSpan={2} style={{ padding: '12px', fontWeight: 'bold', textAlign: 'right' }}>
                      Total:
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                      {aggregating ? <Skeleton width={80} /> : totalCustomers.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </div>
              )}
            </div>
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
         />
        </div>
      </div>
    </div>
  );
};

export default PlanningModal;
