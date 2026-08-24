import { UpdaterProps, UpdaterSelectedItem, VerificationResult } from '@/entrypoints/issue.content/types/Updater';
import { useEffect } from 'react';
import clsx from 'clsx';
import updaterStyles from '../styles/updater.module.scss';
import sundayStyles from '../styles/sunday.module.scss';
import UpdaterTable from './updater/UpdaterTable';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslationsLoader } from '@/entrypoints/issue.content/utils/updater/hooks/useTranslationsLoader';
import { useDateConfig } from '@/entrypoints/issue.content/utils/updater/hooks/useDateConfig';
import { useLPConfig } from '@/entrypoints/issue.content/utils/updater/hooks/useLPConfig';
import { useUpdateHandler } from '@/entrypoints/issue.content/utils/updater/hooks/useUpdateHandler';
import { useSelectionManager } from '@/entrypoints/issue.content/utils/updater/hooks/useSelectionManager';
import { MenuContent } from './updater/MenuContent';
import { useSundayTranslations } from '@/entrypoints/issue.content/utils/updater/hooks/useSundayTranslations';
import { SundayTable } from './updater/SundayTable';
import { SundayButtons } from './updater/SundayButtons';
import { Icon } from '@iconify/react';
import { UpdateResults } from './updater/UpdateResults';
import { getTodayAtMidnight } from '@/entrypoints/issue.content/utils/updater/dates';
import UpdaterButton from './updater/UpdaterButton';
import { verifyBatch } from '../api/verifyService';
import Modal from '@/components/modal/Modal';

const UpdaterModal = ({ rows, issueId, newsletterIds, landingPageIds, onClose }: UpdaterProps) => {
  const availableSlugs = rows.map(row => row.shop);
  const [showResults, setShowResults] = useState(false);

  const [initialSlugDates, setInitialSlugDates] = useState<Record<string, { activate: Date; deactivate: Date }>>({});
  const [initialSlugLPs, setInitialSlugLPs] = useState<Record<string, string>>({});
  const [initialSlugLPBs, setInitialSlugLPBs] = useState<Record<string, string>>({});

  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
  const [verifying, setVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState({ completed: 0, total: 0 });
  const [hasVerified, setHasVerified] = useState(false);

  const isResettingRef = useRef(false);

  const {
    subjectLines,
    loading: sundayLoading,
    isSundayNewsletter,
    selectedIndex,
    selectOption,
    clearSelection,
    getSelectedTranslations,
    error: sundayError,
    retry: retrySunday,
  } = useSundayTranslations({ issueId, availableSlugs: rows.map(r => r.shop) });

  const {
    translations,
    loading,
    error,
    globalLP: initialGlobalLP,
    deactivateDate,
    retry,
    isRefreshed,
    isRefreshing,
  } = useTranslationsLoader({ issueId, rows, isSundayNewsletter: isSundayNewsletter || false });

  const { selectedItems, handleToggleSL, handleTogglePT, handleSelectAllReady, handleClearAll } = useSelectionManager();

  const translationsRef = useRef(translations);
  const selectedItemsRef = useRef(selectedItems);
  const handleToggleSLRef = useRef(handleToggleSL);
  const handleTogglePTRef = useRef(handleTogglePT);

  useEffect(() => {
    translationsRef.current = translations;
    selectedItemsRef.current = selectedItems;
    handleToggleSLRef.current = handleToggleSL;
    handleTogglePTRef.current = handleTogglePT;
  }, [translations, selectedItems, handleToggleSL, handleTogglePT]);

  const autoSelectSlug = useCallback((slug: string) => {
    if (isResettingRef.current) return;

    if (typeof window !== 'undefined' && (window as any).__isResetting) {
      return;
    }

    const currentTranslations = translationsRef.current;
    const currentSelectedItems = selectedItemsRef.current;
    const currentHandleToggleSL = handleToggleSLRef.current;
    const currentHandleTogglePT = handleTogglePTRef.current;

    if (!currentTranslations) return;

    const subjectLine = currentTranslations.subjectLine?.[slug];
    const pageTitle = currentTranslations.pageTitle?.[slug];

    if (subjectLine) {
      const isAlreadySelected = currentSelectedItems.some(item => item.slug === slug && item.type === 'subjectLine');
      if (!isAlreadySelected) {
        currentHandleToggleSL(slug, true, subjectLine);
      }
    }

    if (pageTitle) {
      const isAlreadySelected = currentSelectedItems.some(item => item.slug === slug && item.type === 'pageTitle');
      if (!isAlreadySelected) {
        currentHandleTogglePT(slug, true, pageTitle);
      }
    }
  }, []);

  const {
    useGlobalDate,
    setUseGlobalDate,
    globalDateConfig,
    handleGlobalActivateDateChange,
    handleGlobalDeactivateDateChange,
    handleSlugActivateDateChange,
    handleSlugDeactivateDateChange,
    getDateForSlug,
    initializeSlugDates,
  } = useDateConfig({ initialDeactivateDate: deactivateDate, onAutoSelect: autoSelectSlug });

  const {
    useGlobalLP,
    globalLP,
    globalLPB,
    slugFMDModes,
    handleGlobalLPChange,
    handleGlobalLPBChange,
    handleUseGlobalLPToggle,
    handleSlugFMDModeChange,
    handleSlugLPChange,
    handleSlugLPBChange,
    getLPForSlug,
    initializeSlugLPs,
    setGlobalLP: setHookGlobalLP,
    setGlobalLPB: setHookGlobalLPB,
  } = useLPConfig({ initialGlobalLP, onAutoSelect: autoSelectSlug });

  const hasABLandingPages = useMemo(
    () => Object.values(landingPageIds || {}).some(ids => !!ids?.aId && !!ids?.bId),
    [landingPageIds],
  );

  const {
    isUpdating,
    updateProgress,
    updateResults,
    updatingSlugs,
    isComplete,
    handleUpdateSelected,
    handleUpdateAll,
    handleRetryFailed,
    reset,
    isActivating,
    activationProgress,
    activationResults,
  } = useUpdateHandler({
    getLPForSlug,
    getDateForSlug,
    newsletterIds,
    landingPageIds,
    onClearSelections: handleClearAll,
  });

  useEffect(() => {
    if (initialGlobalLP) {
      setHookGlobalLP(initialGlobalLP);
      setHookGlobalLPB(initialGlobalLP);
    }
  }, [initialGlobalLP, setHookGlobalLP, setHookGlobalLPB]);

  useEffect(() => {
    if (isComplete && !isUpdating) {
      setShowResults(true);
    }
  }, [isComplete, isUpdating]);

  useEffect(() => {
    if (isUpdating) {
      setShowResults(false);
    }
  }, [isUpdating]);

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const handleRetry = () => {
    setShowResults(false);
    handleRetryFailed();
  };

  useEffect(() => {
    if (translations) {
      const allSlugs = new Set([
        ...(translations.subjectLine ? Object.keys(translations.subjectLine) : []),
        ...(translations.pageTitle ? Object.keys(translations.pageTitle) : []),
      ]);

      const slugArray = Array.from(allSlugs);

      if (slugArray.length > 0) {
        initializeSlugDates(slugArray);
        initializeSlugLPs(slugArray, initialGlobalLP, initialGlobalLP);

        const initialDates: Record<string, { activate: Date; deactivate: Date }> = {};
        const initialLPs: Record<string, string> = {};
        const initialLPBs: Record<string, string> = {};

        slugArray.forEach(slug => {
          initialDates[slug] = {
            activate: getTodayAtMidnight(),
            deactivate: deactivateDate || getTodayAtMidnight(),
          };
          initialLPs[slug] = initialGlobalLP;
          initialLPBs[slug] = initialGlobalLP;
        });

        setInitialSlugDates(initialDates);
        setInitialSlugLPs(initialLPs);
        setInitialSlugLPBs(initialLPBs);
      }
    }
  }, [translations]);

  const getInitialActivateDate = useCallback(
    (slug: string) => {
      return initialSlugDates[slug]?.activate;
    },
    [initialSlugDates],
  );

  const getInitialDeactivateDate = useCallback(
    (slug: string) => {
      return initialSlugDates[slug]?.deactivate;
    },
    [initialSlugDates],
  );

  const getInitialLP = useCallback(
    (slug: string) => {
      return initialSlugLPs[slug];
    },
    [initialSlugLPs],
  );

  const getInitialLPB = useCallback(
    (slug: string) => {
      return initialSlugLPBs[slug];
    },
    [initialSlugLPBs],
  );

  const handleGlobalActivateDateChangeWithAutoSelect = (date: Date | null) => {
    handleGlobalActivateDateChange(date);
    if (translations) {
      const allSlugs = new Set([
        ...(translations.subjectLine ? Object.keys(translations.subjectLine) : []),
        ...(translations.pageTitle ? Object.keys(translations.pageTitle) : []),
      ]);
      allSlugs.forEach(slug => autoSelectSlug(slug));
    }
  };

  const handleGlobalDeactivateDateChangeWithAutoSelect = (date: Date | null) => {
    handleGlobalDeactivateDateChange(date);
  };

  const handleGlobalLPChangeWithAutoSelect = (lp: string) => {
    handleGlobalLPChange(lp);

    if (translations) {
      isResettingRef.current = true;
      if (typeof window !== 'undefined') {
        (window as any).__isResetting = true;
      }

      const allSlugs = new Set([
        ...(translations.subjectLine ? Object.keys(translations.subjectLine) : []),
        ...(translations.pageTitle ? Object.keys(translations.pageTitle) : []),
      ]);
      allSlugs.forEach(slug => {
        const subjectLine = translations.subjectLine?.[slug];
        const pageTitle = translations.pageTitle?.[slug];

        // Select subject line if exists and valid
        if (subjectLine) {
          const isAlreadySelected = selectedItems.some(item => item.slug === slug && item.type === 'subjectLine');
          if (!isAlreadySelected) {
            handleToggleSL(slug, true, subjectLine);
          }
        }

        // Select page title if exists and valid
        if (pageTitle) {
          const isAlreadySelected = selectedItems.some(item => item.slug === slug && item.type === 'pageTitle');
          if (!isAlreadySelected) {
            handleTogglePT(slug, true, pageTitle);
          }
        }
      });
      setTimeout(() => {
        isResettingRef.current = false;
        if (typeof window !== 'undefined') {
          (window as any).__isResetting = false;
        }
      }, 200);
    }
  };

  const handleGlobalLPBChangeWithAutoSelect = (lp: string) => {
    handleGlobalLPBChange(lp);

    if (translations) {
      isResettingRef.current = true;
      if (typeof window !== 'undefined') {
        (window as any).__isResetting = true;
      }

      const allSlugs = new Set([
        ...(translations.subjectLine ? Object.keys(translations.subjectLine) : []),
        ...(translations.pageTitle ? Object.keys(translations.pageTitle) : []),
      ]);
      allSlugs.forEach(slug => {
        const subjectLine = translations.subjectLine?.[slug];
        const pageTitle = translations.pageTitle?.[slug];

        if (subjectLine) {
          const isAlreadySelected = selectedItems.some(item => item.slug === slug && item.type === 'subjectLine');
          if (!isAlreadySelected) {
            handleToggleSL(slug, true, subjectLine);
          }
        }

        if (pageTitle) {
          const isAlreadySelected = selectedItems.some(item => item.slug === slug && item.type === 'pageTitle');
          if (!isAlreadySelected) {
            handleTogglePT(slug, true, pageTitle);
          }
        }
      });
      setTimeout(() => {
        isResettingRef.current = false;
        if (typeof window !== 'undefined') {
          (window as any).__isResetting = false;
        }
      }, 200);
    }
  };

  const handleUpdateAllSL = () => {
    if (!translations?.subjectLine) return;

    const allSlugs = Object.keys(translations.subjectLine);
    const allSLItems: UpdaterSelectedItem[] = allSlugs.map(slug => ({
      slug,
      type: 'subjectLine',
      content: translations.subjectLine![slug],
    }));

    handleUpdateSelected(allSLItems);
  };

  const handleUpdateAllPT = () => {
    if (!translations?.pageTitle) return;

    const allSlugs = Object.keys(translations.pageTitle);
    const allPTItems: UpdaterSelectedItem[] = allSlugs.map(slug => ({
      slug,
      type: 'pageTitle',
      content: translations.pageTitle![slug],
    }));

    handleUpdateSelected(allPTItems);
  };

  const handleUpdateSelectedSL = () => {
    const selectedSLItems = selectedItems.filter(item => item.type === 'subjectLine');
    if (selectedSLItems.length === 0) {
      console.warn('No subject lines selected to update');
      return;
    }
    handleUpdateSelected(selectedSLItems);
  };

  const handleUpdateSelectedPT = () => {
    const selectedPTItems = selectedItems.filter(item => item.type === 'pageTitle');
    if (selectedPTItems.length === 0) {
      console.warn('No page titles selected to update');
      return;
    }
    handleUpdateSelected(selectedPTItems);
  };

  const handleUpdateSelectedWrapper = () => {
    if (selectedItems.length === 0) {
      console.warn('No items selected to update');
      return;
    }
    handleUpdateSelected(selectedItems);
  };
  const handleUpdateAllWrapper = () => handleUpdateAll(translations, handleUpdateSelected);
  const handleSelectAllReadyWrapper = () => handleSelectAllReady(translations);

  const verifyAllItems = useCallback(async () => {
    if (!translations?.subjectLine && !translations?.pageTitle) return;

    setVerifying(true);
    setVerifyProgress({ completed: 0, total: 0 });
    setVerificationResults({});
    setHasVerified(true);

    const allSlugs = new Set([
      ...(translations.subjectLine ? Object.keys(translations.subjectLine) : []),
      ...(translations.pageTitle ? Object.keys(translations.pageTitle) : []),
    ]);

    // Prepare items for batch verification
    const itemsToVerify: Array<{
      nsltId: string;
      lpId: string;
      spreadsheetSubject: string | null;
      spreadsheetPageTitle: string | null;
      slug: string;
    }> = [];

    Array.from(allSlugs).forEach(slug => {
      const subjectLine = translations.subjectLine?.[slug] || null;
      const pageTitle = translations.pageTitle?.[slug] || null;
      const nsltId = newsletterIds?.[slug]?.aId || newsletterIds?.[slug]?.bId || null;
      const lpId = landingPageIds?.[slug]?.aId || landingPageIds?.[slug]?.bId || null;

      if (nsltId || lpId) {
        itemsToVerify.push({
          nsltId: nsltId || '',
          lpId: lpId || '',
          spreadsheetSubject: subjectLine,
          spreadsheetPageTitle: pageTitle,
          slug,
        });
      }
    });

    if (itemsToVerify.length === 0) {
      setVerifying(false);
      return;
    }

    // Batch verify with progress
    const results = await verifyBatch(itemsToVerify, (completed, total, result) => {
      setVerifyProgress({ completed, total });
      setVerificationResults(prev => ({
        ...prev,
        [result.slug]: result,
      }));
    });

    setVerifying(false);
    setHasVerified(true);
  }, [translations, newsletterIds, landingPageIds]);

  useEffect(() => {
    if (isComplete && !isUpdating) {
      setShowResults(true);
    }
  }, [isComplete, isUpdating]);

  const selectedSLCount = selectedItems.filter(item => item.type === 'subjectLine').length;
  const selectedPTCount = selectedItems.filter(item => item.type === 'pageTitle').length;

  const showRefreshStatus = !isSundayNewsletter && !isRefreshed;

  const getRefreshMessage = () => {
    if (isRefreshing) return 'Refreshing spreadsheet data...';
    if (loading) return 'Loading spreadsheet data...';
    if (isRefreshed) return 'Spreadsheet data loaded';
    return 'Loading spreadsheet data...';
  };

  const handleSundayUpdate = async () => {
    const selectedTranslations = getSelectedTranslations();
    if (!selectedTranslations) return;

    const selectedItems: UpdaterSelectedItem[] = Object.entries(selectedTranslations).map(([slug, content]) => ({
      slug,
      type: 'subjectLine',
      content,
    }));

    await handleUpdateSelected(selectedItems);
  };

  const getRefreshIcon = () => {
    if (isRefreshing || loading) {
      return <Icon icon="svg-spinners:180-ring" width="16" height="16" className={updaterStyles.refreshSpinner} />;
    }
    if (isRefreshed) {
      return <Icon icon="mdi:check-circle" width="16" height="16" className={updaterStyles.refreshComplete} />;
    }
    return <Icon icon="svg-spinners:180-ring" width="16" height="16" className={updaterStyles.refreshSpinner} />;
  };

  const isSundayUpdating = isUpdating || updateProgress.total > 0 || updatingSlugs.size > 0;

  const getModalTitle = () => {
    if (isSundayNewsletter) return 'Sunday Newsletter Subject Line Updater';
    if (error || sundayError) return 'Error Loading Data';
    if (loading || sundayLoading) return 'Loading...';
    return 'Subject Line & Page Title Updater';
  };

  const hasValidSundayRows = rows.some(row => row.nsltId || row.nsltAId || row.nsltBId);

  const modalContent = (
    <>
      {/* Loading State */}
      {(isSundayNewsletter === null || loading || sundayLoading) && (
        <>
          {!isSundayNewsletter && (
            <div
              className={clsx(updaterStyles.refreshStatusBar, {
                [updaterStyles.refreshComplete]: isRefreshed && !isRefreshing,
              })}
            >
              {getRefreshIcon()}
              <span>{getRefreshMessage()}</span>
              {isRefreshed && !isRefreshing && (
                <span className={updaterStyles.refreshComplete}>
                  <Icon icon="mdi:check-circle" width="14" height="14" />
                  Done
                </span>
              )}
            </div>
          )}
          <div className={sundayStyles.loading}>
            <Icon icon={'svg-spinners:180-ring'} width="70" height="70" />
          </div>
        </>
      )}

      {/* Sunday Newsletter */}
      {isSundayNewsletter && !loading && !sundayLoading && (
        <div className={sundayStyles.container}>
          {/* Progress bar and stats */}
          {isUpdating && updateProgress.total > 0 && (
            <div className={sundayStyles.progressStats}>
              <div className={sundayStyles.progressInfo}>
                <Icon icon="svg-spinners:180-ring" width="14" height="14" className={sundayStyles.progressSpinner} />
                <span>Updating subject lines...</span>
              </div>
              <div className={sundayStyles.progressCount}>
                {updateProgress.completed} / {updateProgress.total} completed
              </div>
            </div>
          )}
          {isUpdating && updateProgress.total > 0 && (
            <div className={sundayStyles.tableProgressBar}>
              <div
                className={sundayStyles.tableProgressFill}
                style={{ width: `${(updateProgress.completed / updateProgress.total) * 100}%` }}
              />
            </div>
          )}

          {showResults && <UpdateResults results={updateResults} onClose={handleModalClose} onRetry={handleRetry} />}

          {hasValidSundayRows ? (
            <SundayTable
              subjectLines={subjectLines}
              selectedIndex={selectedIndex}
              onSelectOption={selectOption}
              loading={sundayLoading}
              availableSlugs={availableSlugs}
              updateResults={updateResults}
              updatingSlugs={updatingSlugs}
              newsletterIds={newsletterIds}
              onRetry={retrySunday}
            />
          ) : (
            <div className={clsx(updaterStyles.modalContent, updaterStyles.emptyAlignment)}>
          <div className={updaterStyles.emptyState}>
            <Icon icon="mdi:file-document-outline" width="48" height="48" className={updaterStyles.emptyIcon} />
            <h3>No checklists with IDs</h3>
            <p>No newsletter IDs (NSLT) found for any shop in this Sunday newsletter.</p>
            <div className={updaterStyles.emptyButtons}>
              <button
                className={updaterStyles.reloadButton}
                onClick={() => {
                  retrySunday();
                }}
              >
                <Icon icon="mdi:refresh" width="16" height="16" />
                Reload
              </button>
              <UpdaterButton isPrimary={false} label="Close" onClick={handleModalClose} icon="mdi:close" />
            </div>
          </div>
        </div>
          )}

          {hasValidSundayRows && (
            <SundayButtons
              hasSelection={selectedIndex !== null}
              onUpdate={handleSundayUpdate}
              onClear={clearSelection}
              loading={sundayLoading}
              isUpdating={isSundayUpdating}
            />
          )}
        </div>
      )}

      {/* Regular Newsletter - only show if there are valid rows */}
      {!isSundayNewsletter && !loading && !sundayLoading && (
        <div className={updaterStyles.bodyInner}>
          <div className={updaterStyles.menu}>
            <MenuContent
              loading={loading}
              useGlobalDate={useGlobalDate}
              useGlobalLP={useGlobalLP}
              globalDateConfig={globalDateConfig}
              globalLP={globalLP}
              globalLPB={globalLPB}
              hasABLandingPages={hasABLandingPages}
              selectedSLCount={selectedSLCount}
              selectedPTCount={selectedPTCount}
              isUpdating={isUpdating}
              onToggleGlobalDate={checked => setUseGlobalDate(checked)}
              onActivateDateChange={handleGlobalActivateDateChangeWithAutoSelect}
              onDeactivateDateChange={handleGlobalDeactivateDateChangeWithAutoSelect}
              onToggleGlobalLP={handleUseGlobalLPToggle}
              onGlobalLPChange={handleGlobalLPChange}
              onGlobalLPBChange={handleGlobalLPBChange}
              onUpdateAllSL={handleUpdateAllSL}
              onUpdateSelectedSL={handleUpdateSelectedSL}
              onUpdateAllPT={handleUpdateAllPT}
              onUpdateSelectedPT={handleUpdateSelectedPT}
              onUpdateAll={handleUpdateAllWrapper}
              onUpdateSelected={handleUpdateSelectedWrapper}
              onSelectAll={handleSelectAllReadyWrapper}
              onClearAll={handleClearAll}
              onCancel={onClose}
              onVerify={verifyAllItems}
              verifying={verifying}
              hasVerified={hasVerified}
              verifyProgress={verifyProgress}
            />
          </div>
          <div className={updaterStyles.rightContent}>
            {showResults && (
              <div className={updaterStyles.resultsContainer}>
                <UpdateResults results={updateResults} onClose={handleModalClose} onRetry={handleRetry} />
              </div>
            )}
            {isUpdating && updateProgress.total > 0 && (
              <>
                <div className={updaterStyles.progressStats}>
                  <div className={updaterStyles.progressInfo}>
                    <Icon
                      icon="svg-spinners:180-ring"
                      width="14"
                      height="14"
                      className={updaterStyles.progressSpinner}
                    />
                    <span>Updating translations...</span>
                  </div>
                  <div className={updaterStyles.progressCount}>
                    {updateProgress.completed} / {updateProgress.total} completed
                  </div>
                </div>
                <div className={updaterStyles.tableProgressBar}>
                  <div
                    className={updaterStyles.tableProgressFill}
                    style={{ width: `${(updateProgress.completed / updateProgress.total) * 100}%` }}
                  />
                </div>
              </>
            )}
            {isActivating && activationProgress.total > 0 && (
              <div className={updaterStyles.activationStats}>
                <div className={updaterStyles.activationInfo}>
                  <Icon
                    icon="svg-spinners:180-ring"
                    width="14"
                    height="14"
                    className={updaterStyles.activationSpinner}
                  />
                  <span>Activating shop contents...</span>
                </div>
                <div className={updaterStyles.activationProgress}>
                  <span>
                    {activationProgress.completed} / {activationProgress.total}
                  </span>
                  <div className={updaterStyles.activationProgressBar}>
                    <div
                      className={updaterStyles.activationProgressFill}
                      style={{ width: `${(activationProgress.completed / activationProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className={updaterStyles.tableContainer}>
              <UpdaterTable
                translations={translations}
                loading={loading || isUpdating}
                onToggleSL={handleToggleSL}
                onTogglePT={handleTogglePT}
                selectedItems={selectedItems}
                getDateForSlug={getDateForSlug}
                getLPForSlug={getLPForSlug}
                getLPBForSlug={slug => getLPForSlug(slug, 'b')}
                onSlugActivateDateChange={handleSlugActivateDateChange}
                onSlugDeactivateDateChange={handleSlugDeactivateDateChange}
                onSlugLPChange={handleSlugLPChange}
                onSlugLPBChange={handleSlugLPBChange}
                useGlobalDates={useGlobalDate}
                useGlobalLP={useGlobalLP}
                globalLP={globalLP}
                initialGlobalLP={initialGlobalLP}
                slugFMDModes={slugFMDModes}
                onSlugFMDModeChange={handleSlugFMDModeChange}
                availableSlugs={availableSlugs}
                newsletterIds={newsletterIds}
                landingPageIds={landingPageIds}
                updatingSlugs={updatingSlugs}
                updateResults={updateResults}
                getInitialActivateDate={getInitialActivateDate}
                getInitialDeactivateDate={getInitialDeactivateDate}
                getInitialLP={getInitialLP}
                getInitialLPB={getInitialLPB}
                verificationResults={verificationResults}
                verifying={verifying}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Now in the return, check for valid rows first
  // Check if there are any valid rows with newsletter IDs or landing page IDs
  const hasValidRows = rows.some(row => row.nsltId || row.nsltAId || row.nsltBId || row.lpId || row.lpAId || row.lpBId);

  // If no valid rows and not a Sunday newsletter, show empty state
  if (!hasValidRows && !isSundayNewsletter && !loading && !sundayLoading) {
    return (
      <Modal
        isOpen={true}
        onClose={handleModalClose}
        title="Subject Line & Page Title Updater"
        width="95vw"
        maxWidth="95vw"
        height="95vh"
        maxHeight="95vh"
      >
        <div className={clsx(updaterStyles.modalContent, updaterStyles.emptyAlignment)}>
          <div className={updaterStyles.emptyState}>
            <Icon icon="mdi:file-document-outline" width="48" height="48" className={updaterStyles.emptyIcon} />
            <h3>No checklists with IDs</h3>
            <p>No newsletter IDs (NSLT) or landing page IDs (LP) found for any shop.</p>
            <div className={updaterStyles.emptyButtons}>
              <button
                className={updaterStyles.reloadButton}
                onClick={() => {
                  retry();
                }}
              >
                <Icon icon="mdi:refresh" width="16" height="16" />
                Reload
              </button>
              <UpdaterButton isPrimary={false} label="Close" onClick={handleModalClose} icon="mdi:close" />
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // Wrap with Modal component
  return (
    <Modal
      isOpen={true}
      onClose={handleModalClose}
      title={getModalTitle()}
      width="95vw"
      maxWidth="95vw"
      height="95vh"
      maxHeight="95vh"
    >
      {modalContent}
    </Modal>
  );
};

export default UpdaterModal;
 