import { UpdaterProps, UpdaterSelectedItem } from '@/entrypoints/newtab/types/Updater';
import { useEffect } from 'react';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import updaterStyles from '../styles/updater.module.scss';
import sundayStyles from '../styles/sunday.module.scss';
import { ModalHeader } from './planningmodal/ModalHeader';
import UpdaterTable from './updater/UpdaterTable';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslationsLoader } from '@/entrypoints/newtab/utils/updater/hooks/useTranslationsLoader';
import { useDateConfig } from '@/entrypoints/newtab/utils/updater/hooks/useDateConfig';
import { useLPConfig } from '@/entrypoints/newtab/utils/updater/hooks/useLPConfig';
import { useUpdateHandler } from '@/entrypoints/newtab/utils/updater/hooks/useUpdateHandler';
import { useSelectionManager } from '@/entrypoints/newtab/utils/updater/hooks/useSelectionManager';
import { MenuContent } from './updater/MenuContent';
import { useSundayTranslations } from '@/entrypoints/newtab/utils/updater/hooks/useSundayTranslations';
import { SundayTable } from './updater/SundayTable';
import { SundayButtons } from './updater/SundayButtons';
import { Icon } from '@iconify/react';
import { UpdateResults } from './updater/UpdateResults';
import { getTodayAtMidnight } from '@/entrypoints/newtab/utils/updater/dates';

const UpdaterModal = ({ rows, issueId, newsletterIds, landingPageIds, onClose }: UpdaterProps) => {
  const availableSlugs = rows.map(row => row.shop);
  const [showResults, setShowResults] = useState(false);

  const [initialSlugDates, setInitialSlugDates] = useState<Record<string, { activate: Date; deactivate: Date }>>({});
  const [initialSlugLPs, setInitialSlugLPs] = useState<Record<string, string>>({});
  const isResettingRef = useRef(false);

  const {
    translations,
    loading,
    error,
    globalLP: initialGlobalLP,
    deactivateDate,
    retry,
  } = useTranslationsLoader({ issueId, rows });

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
    selectedItems,
    handleToggleSL,
    handleTogglePT,
    handleSelectedAllSL,
    handleSelectedAllPT,
    handleSelectAllReady,
    handleClearAll,
  } = useSelectionManager();

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
    slugFMDModes,
    handleGlobalLPChange,
    handleUseGlobalLPToggle,
    handleSlugFMDModeChange,
    handleSlugLPChange,
    getLPForSlug,
    initializeSlugLPs,
    setGlobalLP: setHookGlobalLP,
  } = useLPConfig({ initialGlobalLP, onAutoSelect: autoSelectSlug });

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
  } = useUpdateHandler({
    getLPForSlug,
    getDateForSlug,
    newsletterIds,
    landingPageIds,
  });

  useEffect(() => {
    if (initialGlobalLP) {
      setHookGlobalLP(initialGlobalLP);
    }
  }, [initialGlobalLP, setHookGlobalLP]);

  useEffect(() => {
    if (isComplete && !isUpdating) {
      setShowResults(true);
    }
  }, [isComplete, isUpdating]);

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
        initializeSlugLPs(slugArray, initialGlobalLP);

        const initialDates: Record<string, { activate: Date; deactivate: Date }> = {};
        const initialLPs: Record<string, string> = {};

        slugArray.forEach(slug => {
          initialDates[slug] = {
            activate: getTodayAtMidnight(),
            deactivate: deactivateDate || getTodayAtMidnight(),
          };
          initialLPs[slug] = initialGlobalLP;
        });

        setInitialSlugDates(initialDates);
        setInitialSlugLPs(initialLPs);
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
    if (translations) {
      const allSlugs = new Set([
        ...(translations.subjectLine ? Object.keys(translations.subjectLine) : []),
        ...(translations.pageTitle ? Object.keys(translations.pageTitle) : []),
      ]);
      allSlugs.forEach(slug => autoSelectSlug(slug));
    }
  };

  const handleGlobalLPChangeWithAutoSelect = (lp: string) => {
    handleGlobalLPChange(lp);
    if (translations) {
      const allSlugs = new Set([
        ...(translations.subjectLine ? Object.keys(translations.subjectLine) : []),
        ...(translations.pageTitle ? Object.keys(translations.pageTitle) : []),
      ]);
      allSlugs.forEach(slug => autoSelectSlug(slug));
    }
  };

  const handleUpdateSelectedWrapper = () => handleUpdateSelected(selectedItems);
  const handleUpdateAllWrapper = () => handleUpdateAll(translations, handleUpdateSelected);
  const handleSelectedAllSLWrapper = () => handleSelectedAllSL(translations);
  const handleSelectedAllPTWrapper = () => handleSelectedAllPT(translations);
  const handleSelectAllReadyWrapper = () => handleSelectAllReady(translations);

  const selectedSLCount = selectedItems.filter(item => item.type === 'subjectLine').length;
  const selectedPTCount = selectedItems.filter(item => item.type === 'pageTitle').length;

  if (isSundayNewsletter === null || loading || sundayLoading) {
    if (error || sundayError) {
      return (
        <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
          <div className={clsx(updaterStyles.modal)} onClick={e => e.stopPropagation()}>
            <ModalHeader title="Error Loading Data" onClose={onClose} />
            <div className={sundayStyles.container}>
              <div className={sundayStyles.errorContainer}>
                <Icon icon="mdi:alert-circle" width="48" height="48" className={sundayStyles.errorIcon} />
                <h3>Failed to load translations</h3>
                <p>{error || sundayError}</p>
                <button
                  className={sundayStyles.retryButton}
                  onClick={() => {
                    if (error) retry();
                    if (sundayError) retrySunday();
                  }}
                >
                  <Icon icon="mdi:refresh" width="18" height="18" />
                  Retry
                </button>
                <button className={sundayStyles.closeButton} onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
        <div className={clsx(updaterStyles.modal)} onClick={e => e.stopPropagation()}>
          <ModalHeader title="Loading..." onClose={onClose} />
          <div className={sundayStyles.container}>
            <div className={sundayStyles.loading}>
              <Icon icon={'svg-spinners:180-ring'} width="70" height="70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSundayNewsletter) {
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

    return (
      <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
        <div className={clsx(updaterStyles.modal)} onClick={e => e.stopPropagation()}>
          <ModalHeader title="Sunday Newsletter Subject Line Updater" onClose={onClose} />
          <div className={sundayStyles.container}>
            {isUpdating && updateProgress.total > 0 && (
              <div className={sundayStyles.tableProgressBar}>
                <div
                  className={sundayStyles.tableProgressFill}
                  style={{ width: `${(updateProgress.completed / updateProgress.total) * 100}%` }}
                />
              </div>
            )}
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
            {showResults && <UpdateResults results={updateResults} onClose={handleModalClose} onRetry={handleRetry} />}

            <SundayTable
              subjectLines={subjectLines}
              selectedIndex={selectedIndex}
              onSelectOption={selectOption}
              loading={sundayLoading}
              availableSlugs={availableSlugs}
              updateResults={updateResults}
              updatingSlugs={updatingSlugs}
            />
            <SundayButtons
              hasSelection={selectedIndex !== null}
              onUpdate={handleSundayUpdate}
              onClear={clearSelection}
              loading={sundayLoading}
            />
          </div>
        </div>
      </div>
    );
  }

  const hasNoTranslations =
    !translations?.subjectLine ||
    !translations?.pageTitle ||
    Object.keys(translations.subjectLine).length === 0 ||
    Object.keys(translations.pageTitle).length === 0;

  if (hasNoTranslations) {
    return (
      <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
        <div className={clsx(updaterStyles.modal)} onClick={e => e.stopPropagation()}>
          <ModalHeader title="Subject Line & Page Title Updater" onClose={onClose} />
          <div className={updaterStyles.modalContent} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className={updaterStyles.shopRow} style={{ border: 'none' }}>
              <span>No translations found</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
      <div className={clsx(updaterStyles.modal)} onClick={e => e.stopPropagation()}>
        <ModalHeader title="Subject Line & Page Title Updater" onClose={onClose} />
        <div className={updaterStyles.modalContent}>
          <div className={updaterStyles.menu}>
            <MenuContent
              loading={loading}
              useGlobalDate={useGlobalDate}
              useGlobalLP={useGlobalLP}
              globalDateConfig={globalDateConfig}
              globalLP={globalLP}
              selectedSLCount={selectedSLCount}
              selectedPTCount={selectedPTCount}
              isUpdating={isUpdating}
              onToggleGlobalDate={checked => setUseGlobalDate(checked)}
              onActivateDateChange={handleGlobalActivateDateChangeWithAutoSelect}
              onDeactivateDateChange={handleGlobalDeactivateDateChangeWithAutoSelect}
              onToggleGlobalLP={handleUseGlobalLPToggle}
              onGlobalLPChange={handleGlobalLPChangeWithAutoSelect}
              onUpdateAllSL={handleSelectedAllSLWrapper}
              onUpdateSelectedSL={handleUpdateSelectedWrapper}
              onUpdateAllPT={handleSelectedAllPTWrapper}
              onUpdateSelectedPT={handleUpdateSelectedWrapper}
              onUpdateAll={handleUpdateAllWrapper}
              onUpdateSelected={handleUpdateSelectedWrapper}
              onSelectAll={handleSelectAllReadyWrapper}
              onClearAll={handleClearAll}
              onCancel={onClose}
            />
          </div>
          <div style={{ flex: 1 }}>
            {showResults && <UpdateResults results={updateResults} onClose={handleModalClose} onRetry={handleRetry} />}
            <>
              {isUpdating && updateProgress.total > 0 && (
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
              )}
              {isUpdating && updateProgress.total > 0 && (
                <div className={updaterStyles.tableProgressBar}>
                  <div
                    className={updaterStyles.tableProgressFill}
                    style={{ width: `${(updateProgress.completed / updateProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </>
            <UpdaterTable
              translations={translations}
              loading={loading || isUpdating}
              onToggleSL={handleToggleSL}
              onTogglePT={handleTogglePT}
              selectedItems={selectedItems}
              getDateForSlug={getDateForSlug}
              getLPForSlug={getLPForSlug}
              onSlugActivateDateChange={handleSlugActivateDateChange}
              onSlugDeactivateDateChange={handleSlugDeactivateDateChange}
              onSlugLPChange={handleSlugLPChange}
              useGlobalDates={useGlobalDate}
              useGlobalLP={useGlobalLP}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdaterModal;
