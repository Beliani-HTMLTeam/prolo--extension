import { useCallback, useEffect, useState } from 'react';
import 'sweetalert2/dist/sweetalert2.min.css';
import Overlay from '@/components/overlay/Overlay';
import { OverlayToggleButton } from './components/OverlayToggleButton';
import { DashboardContent } from './components/DashboardContent';
import { useCampaignPush } from './components/hooks/useCampaignPush';
import { useGenerateCampaign } from './components/hooks/useGenerateCampaign';
import { useSlugSelection } from './components/hooks/useSlugSelection';
import { useCampaignNameAndTranslations } from './components/hooks/useCampaignNameAndTranslations';
import { useCampaignStorage } from './components/hooks/useCampaignStorage';
import { useGeneratingGuard } from './components/hooks/useGeneratingGuard';
import { useAvailableTabs } from './components/hooks/useAvailableTabs';
import { useHideAlertifyLogs } from './components/hooks/useHideAlertifyLogs';
import { useCustomOverrides } from './components/hooks/useCustomOverrides';

const NEWSLETTER_SPREADSHEET =
  'https://docs.google.com/spreadsheets/d/1RcsQspit0B3b3xX1NwZ9RWnUzZrkoVDULu2cnPMZ04U/edit?gid=337547236#gid=337547236';

export default function App() {
  const [visible, setVisible] = useState(true);

  // ---- Domain hooks ----
  useHideAlertifyLogs();

  const generating = useGeneratingGuard(60_000);
  const { availableTabs, isLoadingTabs } = useAvailableTabs();
  const [useOldNewsletterFamily, setUseOldNewsletterFamily] = useState(false);
  const [oldNewsletterFamilyIds, setOldNewsletterFamilyIds] = useState<Record<string, string>>({});

  const {
    campaign,
    setCampaign,
    campaignVersion,
    bumpVersion,
    chdeTemplateId,
    setChdeTemplateId,
    previewImage,
    setPreviewImage,
  } = useCampaignStorage();

  const {
    campaignName,
    pushTranslations,
    isLoadingTranslations,
    dateWarning,
    checkCampaignNameDate,
    fetchTranslations,
    handleCampaignNameChange,
    clearTranslations,
  } = useCampaignNameAndTranslations(NEWSLETTER_SPREADSHEET);

  // Clear translations when storage is wiped on mount
  useEffect(() => {
    clearTranslations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { selectedSlugs, toggleSlugSelection, selectAllSlugs, deselectAllSlugs } = useSlugSelection();

  const {
    customImages,
    customTemplates,
    customLpPaths,
    toggleCustomImage,
    updateCustomImageUrl,
    saveCustomImage,
    toggleCustomTemplate,
    updateCustomTemplateValue,
    saveCustomTemplate,
    toggleCustomLpPath,
    updateCustomLpPath,
    saveCustomLpPath,
    applyOverridesToData,
    addCustomTemplate,
    removeCustomTemplate,
  } = useCustomOverrides(campaign, setCampaign, campaignName, bumpVersion);

  const {
    activeSlug,
    setActiveSlug,
    busySlug,
    isRandomTesting,
    isSendingAll,
    testProgress,
    confirmation,
    closeConfirmation,
    handleTest3Random,
    sendAllProgress,
    handleSendAll,
    handleTestRow,
    handleSendRow,
    showSuccess,
    success,
    closeSuccess
  } = useCampaignPush(campaign);

  const { handleGenerateAllSlugs } = useGenerateCampaign({
    campaignName,
    chdeTemplateId,
    selectedSlugs,
    fetchTranslations,
    checkCampaignNameDate,
    applyOverridesToData,
    generating,
    setCampaign,
    setActiveSlug,
    bumpVersion,
    useOldNewsletterFamily, // Add this
    oldNewsletterFamilyIds, // Add this
    onShowSuccess: showSuccess,
  });

  const showOverlay = useCallback(() => setVisible(true), []);
  const hideOverlay = useCallback(() => setVisible(false), []);

  return (
    <>
      {!visible && <OverlayToggleButton onClick={showOverlay} />}
      <Overlay visible={visible}>
        {visible && (
          <DashboardContent
            visible={visible}
            campaign={campaign}
            campaignVersion={campaignVersion}
            activeSlug={activeSlug}
            busySlug={busySlug}
            isRandomTesting={isRandomTesting}
            isSendingAll={isSendingAll}
            campaignName={campaignName}
            chdeTemplateId={chdeTemplateId}
            pushTranslations={pushTranslations}
            selectedSlugs={selectedSlugs}
            previewImage={previewImage}
            customImages={customImages}
            customTemplates={customTemplates}
            customLpPaths={customLpPaths}
            dateWarning={dateWarning}
            isLoadingTranslations={isLoadingTranslations}
            isGenerating={generating.isGenerating}
            isLoadingTabs={isLoadingTabs}
            availableTabs={availableTabs}
            onHideOverlay={hideOverlay}
            onSetCampaignName={handleCampaignNameChange}
            onSetChdeTemplateId={setChdeTemplateId}
            onGenerateAll={handleGenerateAllSlugs}
            onSelectAll={selectAllSlugs}
            onDeselectAll={deselectAllSlugs}
            onToggleSlug={toggleSlugSelection}
            onSetPreviewImage={setPreviewImage}
            onToggleCustomImage={toggleCustomImage}
            onUpdateCustomImageUrl={updateCustomImageUrl}
            onSaveCustomImage={saveCustomImage}
            onToggleCustomTemplate={toggleCustomTemplate}
            onUpdateCustomTemplateValue={updateCustomTemplateValue}
            onSaveCustomTemplate={saveCustomTemplate}
            onAddCustomTemplate={addCustomTemplate}
            onRemoveCustomTemplate={removeCustomTemplate}
            onToggleCustomLpPath={toggleCustomLpPath}
            onUpdateCustomLpPath={updateCustomLpPath}
            onSaveCustomLpPath={saveCustomLpPath}
            onTest3Random={handleTest3Random}
            onSendAll={handleSendAll}
            onTestRow={handleTestRow}
            onSendRow={handleSendRow}
            testProgress={testProgress}
            closeConfirmation={closeConfirmation}
            confirmation={confirmation}
            sendAllProgress={sendAllProgress}
            useOldNewsletterFamily={useOldNewsletterFamily}
            oldNewsletterFamilyIds={oldNewsletterFamilyIds}
            onUseOldNewsletterFamily={setUseOldNewsletterFamily}
            onOldNewsletterIdsChange={setOldNewsletterFamilyIds}
            closeSuccess={closeSuccess}
            success={success}
          />
        )}
      </Overlay>
    </>
  );
}
