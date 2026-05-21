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

const UpdaterModal = ({ rows, issueId, newsletterIds, landingPageIds, onClose }: UpdaterProps) => {
  const availableSlugs = rows.map(row => row.shop);

  const {
    translations,
    loading,
    error,
    globalLP: initialGlobalLP,
    deactivateDate,
  } = useTranslationsLoader({ issueId, rows });

  const {
    subjectLines,
    loading: sundayLoading,
    isSundayNewsletter,
    selectedIndex,
    selectOption,
    clearSelection,
    getSelectedTranslations,
  } = useSundayTranslations({ issueId, availableSlugs: rows.map(r => r.shop) });

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
  } = useDateConfig(deactivateDate);

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
  } = useLPConfig(initialGlobalLP);

  const {
    selectedItems,
    handleToggleSL,
    handleTogglePT,
    handleSelectedAllSL,
    handleSelectedAllPT,
    handleSelectAllReady,
    handleClearAll,
  } = useSelectionManager();

  const { isUpdating, updateProgress, handleUpdateSelected, handleUpdateAll } = useUpdateHandler({
    getLPForSlug,
    getDateForSlug,
    onClose,
    newsletterIds,
    landingPageIds,
  });

  useEffect(() => {
    if (initialGlobalLP) {
      setHookGlobalLP(initialGlobalLP);
    }
  }, [initialGlobalLP, setHookGlobalLP]);

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
      }
    }
  }, [translations]);

  const handleUpdateSelectedWrapper = () => handleUpdateSelected(selectedItems);
  const handleUpdateAllWrapper = () => handleUpdateAll(translations, handleUpdateSelected);
  const handleSelectedAllSLWrapper = () => handleSelectedAllSL(translations);
  const handleSelectedAllPTWrapper = () => handleSelectedAllPT(translations);
  const handleSelectAllReadyWrapper = () => handleSelectAllReady(translations);

  const selectedSLCount = selectedItems.filter(item => item.type === 'subjectLine').length;
  const selectedPTCount = selectedItems.filter(item => item.type === 'pageTitle').length;

  if (isSundayNewsletter === null || loading || sundayLoading) {
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
              <div className={sundayStyles.progressOverlay}>
                <div className={sundayStyles.progressContainer}>
                  <div className={sundayStyles.progressHeader}>
                    <Icon icon="svg-spinners:180-ring" width="20" height="20" />
                    <span>Updating subject lines...</span>
                  </div>
                  <div className={sundayStyles.progressBar}>
                    <div
                      className={sundayStyles.progressFill}
                      style={{ width: `${(updateProgress.completed / updateProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className={sundayStyles.progressText}>
                    {updateProgress.completed} / {updateProgress.total} completed
                  </div>
                </div>
              </div>
            )}
            <SundayTable
              subjectLines={subjectLines}
              selectedIndex={selectedIndex}
              onSelectOption={selectOption}
              loading={sundayLoading}
              availableSlugs={availableSlugs}
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
          {isUpdating && updateProgress.total > 0 && (
            <div className={updaterStyles.progressOverlay}>
              <div className={updaterStyles.progressContainer}>
                <div className={updaterStyles.progressHeader}>
                  <Icon icon="svg-spinners:180-ring" width="20" height="20" />
                  <span>Updating translations...</span>
                </div>
                <div className={updaterStyles.progressBar}>
                  <div
                    className={updaterStyles.progressFill}
                    style={{ width: `${(updateProgress.completed / updateProgress.total) * 100}%` }}
                  />
                </div>
                <div className={updaterStyles.progressText}>
                  {updateProgress.completed} / {updateProgress.total} completed
                </div>
              </div>
            </div>
          )}
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
              onActivateDateChange={handleGlobalActivateDateChange}
              onDeactivateDateChange={handleGlobalDeactivateDateChange}
              onToggleGlobalLP={handleUseGlobalLPToggle}
              onGlobalLPChange={handleGlobalLPChange}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdaterModal;
