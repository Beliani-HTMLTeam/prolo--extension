import styles from '../push.module.scss';
import { type MainContentProps } from '../types/push';
import { CampaignActions } from './CampaignActions';
import { CampaignTable } from './CampaignTable';
import { Dialog } from './Dialog';
import { EmptyState } from './EmptyState';
import { FooterInfo } from './FooterInfo';

type Confirmation = NonNullable<MainContentProps['confirmation']>;
type Success = NonNullable<MainContentProps['success']>;

// Module-level defaults: no new objects on every render.
const noop = () => {};
const CLOSED_CONFIRMATION = { isOpen: false, slug: null, onConfirm: null, onCancel: null } as Confirmation;
const CLOSED_SUCCESS = { isOpen: false, title: '', message: '', onClose: noop } as Success;

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
  confirmation = CLOSED_CONFIRMATION,
  closeConfirmation = noop,
  success = CLOSED_SUCCESS,
  closeSuccess = noop,
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
  const totalRows = campaign ? Object.keys(campaign.data).length : 0;
  const hasCampaignData = totalRows > 0;
  const confirmSlug = confirmation.slug?.toUpperCase();

  const handleConfirm = () => confirmation.onConfirm?.();

  const handleSuccessClose = () => {
    closeSuccess();
    success.onClose?.();
  };

  return (
    <div className={styles.mainContent}>
      {confirmation.isOpen && confirmSlug && (
        <Dialog
          isOpen
          variant="confirm"
          title={`Send ${confirmSlug}?`}
          message={
            <>
              This will send the notification to <strong>{confirmSlug}</strong>.
            </>
          }
          confirmLabel="Send Now"
          cancelLabel="Cancel"
          onConfirm={handleConfirm}
          onCancel={closeConfirmation}
        />
      )}

      {success.isOpen && (
        <Dialog isOpen variant="success" title={success.title} message={success.message} onClose={handleSuccessClose} />
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
