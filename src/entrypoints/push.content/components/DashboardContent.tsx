import styles from '../push.module.scss';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';
import { DashboardContentProps } from '../types/push';

export const DashboardContent = ({
  campaign,
  campaignVersion = 0,
  activeSlug,
  busySlug,
  isRandomTesting,
  isSendingAll,
  campaignName,
  chdeTemplateId,
  pushTranslations,
  selectedSlugs,
  previewImage,
  customImages,
  customTemplates,
  customLpPaths,
  dateWarning,
  isLoadingTranslations,
  isGenerating,
  isLoadingTabs,
  availableTabs = [],
  onAddCustomTemplate,
  onRemoveCustomTemplate,
  onHideOverlay,
  onSetCampaignName,
  onSetChdeTemplateId,
  onGenerateAll,
  onSelectAll,
  onDeselectAll,
  onToggleSlug,
  onSetPreviewImage,
  onToggleCustomImage,
  onUpdateCustomImageUrl,
  onSaveCustomImage,
  onToggleCustomTemplate,
  onUpdateCustomTemplateValue,
  onSaveCustomTemplate,
  onToggleCustomLpPath,
  onUpdateCustomLpPath,
  onSaveCustomLpPath,
  onTest3Random,
  onSendAll,
  onTestRow,
  onSendRow,
  testProgress,
  sendAllProgress,
  confirmation,
  closeConfirmation,
  success,
  closeSuccess,
  useOldNewsletterFamily = false,
  oldNewsletterFamilyIds,
  onUseOldNewsletterFamily,
  onOldNewsletterIdsChange,
}: DashboardContentProps) => {
  return (
    <div className={styles.dashboardOverlay}>
      <button onClick={onHideOverlay} className={styles.closeButton}>
        ✕ Close
      </button>
      <div className={styles.dashboardLayout}>
        <Sidebar
          campaign={campaign}
          campaignName={campaignName}
          chdeTemplateId={chdeTemplateId}
          selectedSlugs={selectedSlugs}
          previewImage={previewImage}
          dateWarning={dateWarning}
          isLoadingTranslations={isLoadingTranslations}
          isGenerating={isGenerating}
          isLoadingTabs={isLoadingTabs}
          availableTabs={availableTabs}
          onSetCampaignName={onSetCampaignName}
          onSetChdeTemplateId={onSetChdeTemplateId}
          onGenerateAll={onGenerateAll}
          onSelectAll={onSelectAll}
          onDeselectAll={onDeselectAll}
          onToggleSlug={onToggleSlug}
          onSetPreviewImage={onSetPreviewImage}
          onAddCustomTemplate={onAddCustomTemplate}
          onRemoveCustomTemplate={onRemoveCustomTemplate}
          customTemplates={customTemplates}
          useOldNewsletterFamily={useOldNewsletterFamily}
          oldNewsletterFamilyIds={oldNewsletterFamilyIds}
          onUseOldNewsletterFamily={onUseOldNewsletterFamily}
          onOldNewsletterIdsChange={onOldNewsletterIdsChange}
        />

        <MainContent
          campaign={campaign}
          campaignVersion={campaignVersion}
          activeSlug={activeSlug}
          busySlug={busySlug}
          isRandomTesting={isRandomTesting}
          isSendingAll={isSendingAll}
          isGenerating={isGenerating}
          isLoadingTranslations={isLoadingTranslations}
          campaignName={campaignName}
          customImages={customImages}
          customTemplates={customTemplates}
          customLpPaths={customLpPaths}
          onToggleCustomImage={onToggleCustomImage}
          onUpdateCustomImageUrl={onUpdateCustomImageUrl}
          onSaveCustomImage={onSaveCustomImage}
          onToggleCustomTemplate={onToggleCustomTemplate}
          onUpdateCustomTemplateValue={onUpdateCustomTemplateValue}
          onSaveCustomTemplate={onSaveCustomTemplate}
          onToggleCustomLpPath={onToggleCustomLpPath}
          onUpdateCustomLpPath={onUpdateCustomLpPath}
          onSaveCustomLpPath={onSaveCustomLpPath}
          onSetPreviewImage={onSetPreviewImage}
          onTestRow={onTestRow}
          onSendRow={onSendRow}
          onTest3Random={onTest3Random}
          onSendAll={onSendAll}
          testProgress={testProgress}
          sendAllProgress={sendAllProgress}
          confirmation={confirmation}
          closeConfirmation={closeConfirmation}
          success={success}
          closeSuccess={closeSuccess}
        />
      </div>
    </div>
  );
};
