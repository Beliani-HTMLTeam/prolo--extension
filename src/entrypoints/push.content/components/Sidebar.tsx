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
  oldNewsletterFamilyIds?: Record<string, string>;
  useOldNewsletterFamily?: boolean;
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
  onOldNewsletterIdsChange?: (ids: Record<string, string>) => void;
  onUseOldNewsletterFamily?: (useOld: boolean) => void;
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
  oldNewsletterFamilyIds = {},
  useOldNewsletterFamily = false,
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
  onOldNewsletterIdsChange,
  onUseOldNewsletterFamily,
}: SidebarProps) => {
  const [localUseOldFamily, setLocalUseOldFamily] = useState(useOldNewsletterFamily);
  const [hrTemplateId, setHrTemplateId] = useState(oldNewsletterFamilyIds?.HR || '');
  const [siTemplateId, setSiTemplateId] = useState(oldNewsletterFamilyIds?.SI || '');

  // Initialize from props if available
  useEffect(() => {
    setLocalUseOldFamily(useOldNewsletterFamily);
  }, [useOldNewsletterFamily]);

  // Initialize from props if available
  useEffect(() => {
    if (oldNewsletterFamilyIds?.HR) {
      setHrTemplateId(oldNewsletterFamilyIds.HR);
    }
    if (oldNewsletterFamilyIds?.SI) {
      setSiTemplateId(oldNewsletterFamilyIds.SI);
    }
  }, [oldNewsletterFamilyIds]);

  const handleFamilyToggle = (useOld: boolean) => {
    setLocalUseOldFamily(useOld);
    if (onUseOldNewsletterFamily) {
      onUseOldNewsletterFamily(useOld);
    }
  };

 const handleOldNewsletterChange = (slug: string, value: string) => {
    const ids: Record<string, string> = {};
    if (slug === 'HR') {
      setHrTemplateId(value);
      if (value) ids.HR = value;
      if (siTemplateId) ids.SI = siTemplateId;
    } else if (slug === 'SI') {
      setSiTemplateId(value);
      if (hrTemplateId) ids.HR = hrTemplateId;
      if (value) ids.SI = value;
    }
    
    if (onOldNewsletterIdsChange) {
      onOldNewsletterIdsChange(ids);
    }
  };

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

      {/* Newsletter Family Toggle */}
      <div className={styles.newsletterFamilyToggle}>
        <div className={styles.toggleHeader}>
          <span className={styles.toggleTitle}>📬 Newsletter Family</span>
        </div>
        <div className={styles.toggleContainer}>
          <button
            className={`${styles.toggleOption} ${!localUseOldFamily ? styles.active : ''}`}
            onClick={() => handleFamilyToggle(false)}
            disabled={isGenerating || isLoadingTranslations}
          >
            New Family
            <span className={styles.toggleOptionHint}>HR + SI in sequence</span>
          </button>
          <button
            className={`${styles.toggleOption} ${localUseOldFamily ? styles.active : ''}`}
            onClick={() => handleFamilyToggle(true)}
            disabled={isGenerating || isLoadingTranslations}
          >
            Old Family
            <span className={styles.toggleOptionHint}>Manual HR + SI</span>
          </button>
        </div>
      </div>

      {/* Old Newsletter Family IDs - only show when old family is selected */}
      {localUseOldFamily && (
        <div className={styles.oldNewsletterSection}>
          <div className={styles.oldNewsletterHeader}>
            <span className={styles.oldNewsletterTitle}>📜 Old Newsletter Family</span>
            <span className={styles.oldNewsletterHint}>HR and SI - manual IDs</span>
          </div>
          <div className={styles.oldNewsletterRow}>
            <div className={styles.oldNewsletterField}>
              <label>HR Template ID:</label>
              <input
                type="text"
                value={hrTemplateId}
                onChange={e => handleOldNewsletterChange('HR', e.target.value)}
                placeholder="Enter HR template ID"
                className={styles.inputSmall}
              />
            </div>
            <div className={styles.oldNewsletterField}>
              <label>SI Template ID:</label>
              <input
                type="text"
                value={siTemplateId}
                onChange={e => handleOldNewsletterChange('SI', e.target.value)}
                placeholder="Enter SI template ID"
                className={styles.inputSmall}
              />
            </div>
          </div>
        </div>
      )}

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