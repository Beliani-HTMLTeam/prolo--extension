import styles from '../push.module.scss';
import { MainContentProps } from '../types/push';
import { CampaignActions } from './CampaignActions';
import { CampaignTable } from './CampaignTable';
import { ConfirmationDialog } from './ConfirmationDialog';
import { Dialog } from './Dialog';
import { EmptyState } from './EmptyState';
import { FooterInfo } from './FooterInfo';
import { SuccessDialog } from './SuccessDialog';

export const MainContent = ({
  campaign,
  campaignVersion,
  activeSlug,
  busySlug,
  isRandomTesting,
  isSendingAll,
  isGenerating,
  isLoadingTranslations,
  campaignName,
  testProgress,
  sendAllProgress,
  confirmation = { isOpen: false, slug: null, onConfirm: null, onCancel: null },
  closeConfirmation = () => {},
  success = { isOpen: false, title: '', message: '', onClose: () => {} }, // Add default
  closeSuccess = () => {}, // Add default
  customImages,
  customTemplates,
  customLpPaths,
  onToggleCustomImage,
  onUpdateCustomImageUrl,
  onSaveCustomImage,
  onToggleCustomTemplate,
  onUpdateCustomTemplateValue,
  onSaveCustomTemplate,
  onToggleCustomLpPath,
  onUpdateCustomLpPath,
  onSaveCustomLpPath,
  onSetPreviewImage,
  onTestRow,
  onSendRow,
  onTest3Random,
  onSendAll,
}: MainContentProps) => {
  const hasCampaignData = campaign && Object.keys(campaign.data).length > 0;
  const totalRows = hasCampaignData ? Object.keys(campaign.data).length : 0;

  const handleConfirm = () => {
    console.log('Confirm clicked');
    if (confirmation.onConfirm) {
      confirmation.onConfirm();
    }
  };

  const handleCancel = () => {
    console.log('Cancel clicked');
    if (closeConfirmation) {
      closeConfirmation();
    }
  };

  const handleSuccessClose = () => {
    if (closeSuccess) {
      closeSuccess();
    }
    if (success.onClose) {
      success.onClose();
    }
  };

  return (
    <div className={styles.mainContent}>
      {confirmation.isOpen && confirmation.slug && (
        <Dialog
          isOpen={confirmation.isOpen}
          variant="confirm"
          title={`Send ${confirmation.slug?.toUpperCase()}?`}
          message={
            <>
              This will send the notification to <strong>{confirmation.slug?.toUpperCase()}</strong>.
            </>
          }
          confirmLabel="Send Now"
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {success.isOpen && (
        <Dialog
          variant="success"
          isOpen={success.isOpen}
          title={success.title}
          message={success.message}
          onClose={handleSuccessClose}
        />
      )}

      {!hasCampaignData ? (
        <EmptyState isGenerating={isGenerating} isLoadingTranslations={isLoadingTranslations} />
      ) : (
        <>
          <CampaignActions
            isRandomTesting={isRandomTesting}
            isSendingAll={isSendingAll}
            hasCampaignData={hasCampaignData}
            testProgress={testProgress}
            sendAllProgress={sendAllProgress}
            onTest3Random={onTest3Random}
            onSendAll={onSendAll}
            activeSlug={activeSlug}
          />

          <CampaignTable
            key={campaignVersion}
            campaign={campaign}
            activeSlug={activeSlug}
            busySlug={busySlug}
            isRandomTesting={isRandomTesting}
            isSendingAll={isSendingAll}
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
          />

          <FooterInfo totalRows={totalRows} campaignTitle={campaign?.title || ''} />
        </>
      )}
    </div>
  );
};
