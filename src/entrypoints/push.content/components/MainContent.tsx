import styles from '../push.module.scss';
import { CampaignActions } from './CampaignActions';
import { CampaignTable } from './CampaignTable';
import { ConfirmationDialog } from './ConfirmationDialog';
import { EmptyState } from './EmptyState';
import { FooterInfo } from './FooterInfo';
import { SuccessDialog } from './SuccessDialog';

type MainContentProps = {
  campaign: any;
  campaignVersion: number;
  activeSlug: string | null;
  busySlug: string | null;
  isRandomTesting: boolean;
  isSendingAll: boolean;
  isGenerating?: boolean;
  isLoadingTranslations?: boolean;
  campaignName: string;
  testProgress?: { current: number; total: number } | null;
  sendAllProgress?: { current: number; total: number } | null;
  confirmation?: { isOpen: boolean; slug: string | null; onConfirm: (() => void) | null; onCancel: (() => void) | null };
  closeConfirmation?: () => void;
  success?: { isOpen: boolean; title: string; message: string; onClose: () => void }; // Add this
  closeSuccess?: () => void; // Add this
  customImages: Record<string, any>;
  customTemplates: Record<string, any>;
  customLpPaths: Record<string, any>;
  onToggleCustomImage: (slug: string) => void;
  onUpdateCustomImageUrl: (slug: string, url: string) => void;
  onSaveCustomImage: (slug: string) => void;
  onToggleCustomTemplate: (slug: string) => void;
  onUpdateCustomTemplateValue: (slug: string, value: string) => void;
  onSaveCustomTemplate: (slug: string) => void;
  onToggleCustomLpPath: (slug: string) => void;
  onUpdateCustomLpPath: (slug: string, value: string) => void;
  onSaveCustomLpPath: (slug: string) => void;
  onSetPreviewImage: (value: any) => void;
  onTestRow: (slug: string) => void;
  onSendRow: (slug: string) => void;
  onTest3Random: () => void;
  onSendAll: () => void;
};

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

  console.log('🔍 MainContent render - confirmation:', confirmation);
  console.log('🔍 isOpen:', confirmation.isOpen);

  // Handle confirmation
  const handleConfirm = () => {
    console.log('✅ Confirm clicked');
    if (confirmation.onConfirm) {
      confirmation.onConfirm();
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel clicked');
    if (closeConfirmation) {
      closeConfirmation();
    }
  };

  // Handle success
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
      {/* Confirmation Dialog */}
      {confirmation.isOpen && confirmation.slug && (
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          slug={confirmation.slug}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Success Dialog */}
      {success.isOpen && (
        <SuccessDialog
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