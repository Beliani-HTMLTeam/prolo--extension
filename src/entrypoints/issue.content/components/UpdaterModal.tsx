import { UpdaterProps } from '@/entrypoints/newtab/types/Updater';
import { useEffect } from 'react';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import updaterStyles from '../styles/updater.module.scss';
import { ModalHeader } from './planningmodal/ModalHeader';
import UpdaterTable from './updater/UpdaterTable';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslationsLoader } from '@/entrypoints/newtab/utils/updater/hooks/useTranslationsLoader';
import { useDateConfig } from '@/entrypoints/newtab/utils/updater/hooks/useDateConfig';
import { useLPConfig } from '@/entrypoints/newtab/utils/updater/hooks/useLPConfig';
import { useUpdateHandler } from '@/entrypoints/newtab/utils/updater/hooks/useUpdateHandler';
import { useSelectionManager } from '@/entrypoints/newtab/utils/updater/hooks/useSelectionManager';
import { MenuContent } from './updater/MenuContent';

const UpdaterModal = ({ rows, issueId, onClose }: UpdaterProps) => {
  const availableSlugs = rows.map(row => row.shop);

  const {
    translations,
    loading,
    error,
    globalLP: initialGlobalLP,
    deactivateDate,
  } = useTranslationsLoader({ issueId, rows });
  
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

  const { isUpdating, handleUpdateSelected, handleUpdateAll } = useUpdateHandler({
    getLPForSlug,
    getDateForSlug,
    onClose,
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdaterModal;
