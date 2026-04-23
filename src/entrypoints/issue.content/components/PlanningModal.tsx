import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import planningStyles from '../styles/planning.module.scss';

import { getShopIdsMap } from '@/entrypoints/newtab/utils/planning/getShopIdsMap';
import { useNewsletterTitle } from '@/entrypoints/newtab/utils/planning/hooks/useNewsletterTitle';
import { PlanningModalProps, PlanningResult } from '@/entrypoints/newtab/types/Planning';
import { usePlanning } from '@/entrypoints/newtab/utils/planning/hooks/usePlanning';
import { formatResultsForClipboard, getTotalCustomers } from '@/entrypoints/newtab/utils/planning/resultHelpers';
import { ModalHeader } from './planningmodal/ModalHeader';
import { isSlugReadyForPlanning } from '@/entrypoints/newtab/utils/planning/isSlugReadyForPlanning';
import { Icon } from '@iconify/react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const normalizeSlugForSlug = (slug: string): string => {
  const NORMALIZATION: Record<string, string> = {
    ES: 'SP',
  };
  return NORMALIZATION[slug] || slug;
};

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
    return newsletterTitle ? newsletterTitle.split('SL')[0].trim() : 'Start Planning';
  }, [showResults, newsletterTitleLoading, newsletterTitle]);

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
  const isReady = (slug: string) => {
    return isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode);
  };

  const allSlugsSelected = useMemo(() => {
    const selectableSlugs = availableSlugs.filter(slug =>
      isSlugReadyForPlanning(tableData || null, slug, isABTesting || false, mode),
    );
    return selectableSlugs.length > 0 && selectableSlugs.every(slug => selectedSlugs.has(slug));
  }, [availableSlugs, selectedSlugs, tableData, isABTesting, mode]);

  const hasSelectedSlugs = selectedSlugs.size > 0;

  const displayError = error || newsletterTitleError;

  const getCustomerCount = (result?: PlanningResult, slug?: string) => {
    if (!planningStarted) return '-';
    if (!selectedSlugs.has(slug || '')) return '-';
    if (aggregating) return null;
    if (!result) return null;
    if (!result.aggregated) return null;
    if (result.status === 'error') return '0';
    return result.customers !== undefined ? result.customers.toLocaleString() : '-';
  };

  const getSubjectLine = (result?: PlanningResult, slug?: string) => {
    if (!planningStarted) return '-';
    if (!selectedSlugs.has(slug || '')) return '-';
    if (aggregating) return null;
    if (!result) return null;
    if (!result.aggregated) return null;
    return result.subjectLine || '-';
  };

  const getStatusDisplay = (result?: PlanningResult, slug?: string, ready?: boolean) => {
    if (!selectedSlugs.has(slug || '') && planningStarted) return null;

    if (!ready)
      return (
        <span>
          <Icon icon="material-symbols:error" width="14" height="14" /> Requires approval
        </span>
      );
    if (planningStarted && aggregating)
      return (
        <span>
          <Icon icon="material-symbols:info" width="14" height="14" /> Fetching customer data...
        </span>
      );
    if (planningStarted && !result)
      return (
        <span>
          <Icon icon="fa:hourglass-start" width="14" height="14" /> Pending...
        </span>
      );
    if (result?.status === 'success')
      return (
        <span>
          <Icon icon="fluent-mdl2:completed-solid" width="14" height="14" /> Ready
        </span>
      );
    if (result?.status === 'error')
      return (
        <span style={{ color: '#f44336' }}>
          <Icon icon="material-symbols:close-rounded" width="14" height="14" /> {result.error}
        </span>
      );
    if (ready && !planningStarted)
      return (
        <span>
          <Icon icon="material-symbols:local-fire-department" width="14" height="14" /> Ready to plan
        </span>
      );

    return null;
  };

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
            <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button
                className={clsx(formStyles.btn, formStyles['btn--primary'], planningStyles.btn)}
                onClick={handleSendAll}
                disabled={loading || availableSlugs.length === 0 || hasSelectedSlugs}
              >
                <Icon icon="mdi:send" width="16" height="16" />
                Send All
              </button>
              <button
                className={clsx(formStyles.btn, formStyles['btn--primary'], planningStyles.btn)}
                onClick={handleSendSelected}
                disabled={loading || selectedSlugs.size === 0 || allSlugsSelected}
              >
                <Icon icon="mdi:send-check" width="16" height="16" />
                Send Selected ({selectedSlugs.size})
              </button>
              <button
                className={clsx(formStyles.btn, formStyles['btn--ghost'], planningStyles.btn)}
                onClick={selectAll}
                disabled={loading}
              >
                Select All Ready
              </button>
              <button
                className={clsx(formStyles.btn, formStyles['btn--ghost'], planningStyles.btn)}
                onClick={clearAll}
                disabled={loading}
              >
                Clear All
              </button>
              <button
                className={clsx(formStyles.btn, formStyles['btn--ghost'], planningStyles.btn)}
                style={{ marginTop: '25px' }}
                onClick={planningStarted ? handleCancel : handleClose}
              >
                Cancel
              </button>
            </div>
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
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {availableSlugs.map(slug => {
                  const normalizedSlug = normalizeSlugForSlug(slug);
                  const result = results.find(r => r.slug === slug) || results.find(r => r.slug === normalizedSlug);
                  const ready = isReady(slug);
                  const isSelected = selectedSlugs.has(slug);
                  const customerCount = getCustomerCount(result, slug);
                  const subjectLine = getSubjectLine(result, slug);

                  return (
                    <tr key={slug}>
                      <td style={{ textAlign: 'center', padding: '4px', width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSlug(slug)}
                          disabled={loading || !ready}
                        />
                      </td>
                      <td style={{ padding: '4px', fontWeight: 500, width: '100px' }}>
                        {slug}
                        {!ready && (
                          <Icon
                            icon="mdi:alert-circle"
                            width="14"
                            height="14"
                            style={{ color: '#ff9800', marginLeft: '8px' }}
                          />
                        )}
                      </td>
                      <td
                        style={{
                          padding: '8px',
                          fontSize: '12px',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                        }}
                      >
                        {subjectLine === null ? <Skeleton width={200} /> : subjectLine}
                      </td>
                      <td style={{ textAlign: 'center', padding: '4px', width: '100px' }}>
                        {customerCount === null ? <Skeleton width={60} /> : customerCount}
                      </td>

                      <td
                        style={{ padding: '4px', fontSize: '12px', color: '#666', width: '150px', textAlign: 'center' }}
                      >
                        {getStatusDisplay(result, slug, ready)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningModal;
