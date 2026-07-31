import { BigImagePreview } from "./BigImagePreview";
import { CampaignSelector } from "./CampaignSelector";
import { ChdeTemplateInput } from "./ChdeTemplateInput";
import { SlugSelector } from "./SlugSelector";
import { TemplatePreview } from "./TemplatePreview";
import styles from '../push.module.scss';

type SidebarProps = {
  campaign: any;
  campaignName: string;
  chdeTemplateId: string;
  selectedSlugs: string[];
  previewImage: { src: string; alt: string } | null;
  dateWarning?: string | null;
  isLoadingTranslations?: boolean;
  isGenerating?: boolean;
  isLoadingTabs?: boolean;
  availableTabs?: string[];
  customTemplates?: Record<string, { value: string; isEditing: boolean }>;
  onSetCampaignName: (name: string) => void;
  onSetChdeTemplateId: (id: string) => void;
  onGenerateAll: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleSlug: (slug: string) => void;
  onSetPreviewImage: (value: any) => void;
  onToggleCustomTemplate?: (slug: string) => void;
  onUpdateCustomTemplateValue?: (slug: string, value: string) => void;
  onSaveCustomTemplate?: (slug: string) => void;
  onAddCustomTemplate?: (slug: string, value: string) => void;
  onRemoveCustomTemplate?: (slug: string) => void;
};

export const Sidebar = ({
  campaign,
  campaignName,
  chdeTemplateId,
  selectedSlugs,
  previewImage,
  dateWarning,
  isLoadingTranslations,
  isGenerating,
  isLoadingTabs,
  availableTabs = [],
  customTemplates = {},
  onSetCampaignName,
  onSetChdeTemplateId,
  onGenerateAll,
  onSelectAll,
  onDeselectAll,
  onToggleSlug,
  onSetPreviewImage,
  onToggleCustomTemplate,
  onUpdateCustomTemplateValue,
  onSaveCustomTemplate,
  onAddCustomTemplate,
  onRemoveCustomTemplate,
}: SidebarProps) => {
  console.log('🔄 Sidebar render - customTemplates:', customTemplates);

  return (
    <div className={styles.sidebar}>
      <CampaignSelector
        campaignName={campaignName}
        availableTabs={availableTabs}
        isLoadingTabs={isLoadingTabs}
        isLoadingTranslations={isLoadingTranslations}
        dateWarning={dateWarning}
        onSetCampaignName={onSetCampaignName}
      />

      <BigImagePreview
        src={previewImage?.src || null}
        alt={previewImage?.alt || 'Preview'}
        onClose={() => onSetPreviewImage(null)}
      />

      <ChdeTemplateInput
        chdeTemplateId={chdeTemplateId}
        isGenerating={isGenerating}
        isLoadingTranslations={isLoadingTranslations}
        campaignName={campaignName}
        onSetChdeTemplateId={onSetChdeTemplateId}
        onGenerateAll={onGenerateAll}
        customTemplates={customTemplates}
        onToggleCustomTemplate={onToggleCustomTemplate}
        onUpdateCustomTemplateValue={onUpdateCustomTemplateValue}
        onSaveCustomTemplate={onSaveCustomTemplate}
        onAddCustomTemplate={onAddCustomTemplate}
        onRemoveCustomTemplate={onRemoveCustomTemplate}
      />

      <SlugSelector
        selectedSlugs={selectedSlugs}
        campaign={campaign}
        onToggleSlug={onToggleSlug}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />
    </div>
  );
};