import { Dispatch, SetStateAction } from 'react';
import styles from '../push.module.scss';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';

type CampaignRowData = {
  [selector: string]: string;
};

type StoredCampaign = {
  id: number;
  title: string;
  data: Record<string, CampaignRowData>;
};

type CustomImage = { enabled: boolean; url: string; isEditing: boolean };
type CustomTemplate = { value: string; isEditing: boolean };
type CustomLpPath = { value: string; isEditing: boolean };

type DashboardContentProps = {
  visible: boolean;
  campaign: StoredCampaign | null;
  campaignVersion?: number;
  activeSlug: string | null;
  busySlug: string | null;
  isRandomTesting: boolean;
  isSendingAll: boolean;
  campaignName: string;
  chdeTemplateId: string;
  pushTranslations: unknown;
  selectedSlugs: string[];
  previewImage: { src: string; alt: string } | null;
  customImages: Record<string, CustomImage>;
  customTemplates: Record<string, CustomTemplate>;
  customLpPaths: Record<string, CustomLpPath>;
  dateWarning?: string | null;
  isLoadingTranslations?: boolean;
  isGenerating?: boolean;
  isLoadingTabs?: boolean;
  availableTabs?: string[];
  onHideOverlay: () => void;
  onSetCampaignName: (name: string) => void;
  onSetChdeTemplateId: (id: string) => void;
  onGenerateAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSlug: (slug: string) => void;
  onSetPreviewImage: Dispatch<SetStateAction<{ src: string; alt: string } | null>>;
  onToggleCustomImage: (slug: string) => void;
  onUpdateCustomImageUrl: (slug: string, url: string) => void;
  onSaveCustomImage: (slug: string) => void;
  onToggleCustomTemplate: (slug: string) => void;
  onUpdateCustomTemplateValue: (slug: string, value: string) => void;
  onSaveCustomTemplate: (slug: string) => void;
  onToggleCustomLpPath: (slug: string) => void;
  onUpdateCustomLpPath: (slug: string, value: string) => void;
  onSaveCustomLpPath: (slug: string) => void;
  onTest3Random: () => void;
  onSendAll: () => void;
  onTestRow: (slug: string) => void;
  onSendRow: (slug: string) => void;
  testProgress?: { current: number; total: number } | null;
  onAddCustomTemplate: (slug: string, value: string) => void; // Add this
  onRemoveCustomTemplate: (slug: string) => void; // Add this
};

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
   onAddCustomTemplate, // Add this
  onRemoveCustomTemplate, // Add this
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
          onAddCustomTemplate={onAddCustomTemplate} // Pass this
          onRemoveCustomTemplate={onRemoveCustomTemplate} // Pass this
          customTemplates={customTemplates}
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
        />
      </div>
    </div>
  );
};
