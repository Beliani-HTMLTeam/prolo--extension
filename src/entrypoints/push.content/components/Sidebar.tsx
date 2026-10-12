import { memo, useCallback, useEffect, useState } from 'react';
import { BigImagePreview } from './BigImagePreview';
import { CampaignSelector } from './CampaignSelector';
import { ChdeTemplateInput } from './ChdeTemplateInput';
import { SlugSelector } from './SlugSelector';
import styles from '../push.module.scss';
import { type CustomDateProps } from '../helpers/customDate';
import { type SidebarProps } from '../types/push';

/* ------------------------------------------------------------------ */
/* Newsletter family (New vs Old + manual HR / SI IDs)                 */
/* ------------------------------------------------------------------ */

type FamilyIds = { HR: string; SI: string };

const EMPTY_TABS: string[] = [];

interface NewsletterFamilyProps {
  useOldFamily: boolean;
  hrId?: string;
  siId?: string;
  disabled: boolean;
  onUseOldNewsletterFamily?: (useOld: boolean) => void;
  onOldNewsletterIdsChange?: (ids: Record<string, string>) => void;
}

const NewsletterFamily = memo(
  ({ useOldFamily, hrId, siId, disabled, onUseOldNewsletterFamily, onOldNewsletterIdsChange }: NewsletterFamilyProps) => {
    const [localUseOld, setLocalUseOld] = useState(useOldFamily);
    const [ids, setIds] = useState<FamilyIds>({ HR: hrId || '', SI: siId || '' });

    useEffect(() => setLocalUseOld(useOldFamily), [useOldFamily]);

    // Same as before: only non-empty values coming from the parent overwrite the inputs.
    useEffect(() => {
      if (hrId) setIds(prev => (prev.HR === hrId ? prev : { ...prev, HR: hrId }));
    }, [hrId]);
    useEffect(() => {
      if (siId) setIds(prev => (prev.SI === siId ? prev : { ...prev, SI: siId }));
    }, [siId]);

    const handleFamilyToggle = (useOld: boolean) => {
      setLocalUseOld(useOld);
      onUseOldNewsletterFamily?.(useOld);
    };

    const handleIdChange = (slug: keyof FamilyIds, value: string) => {
      const next = { ...ids, [slug]: value };
      setIds(next);
      // Emit only non-empty IDs (unchanged contract).
      const payload: Record<string, string> = {};
      if (next.HR) payload.HR = next.HR;
      if (next.SI) payload.SI = next.SI;
      onOldNewsletterIdsChange?.(payload);
    };

    return (
      <>
        <div className={styles.newsletterFamilyToggle}>
          <div className={styles.toggleHeader}>
            <span className={styles.toggleTitle}>📬 Newsletter Family</span>
          </div>
          <div className={styles.toggleContainer}>
            <button
              type="button"
              className={`${styles.toggleOption} ${!localUseOld ? styles.active : ''}`}
              onClick={() => handleFamilyToggle(false)}
              disabled={disabled}
            >
              New Family
              <span className={styles.toggleOptionHint}>HR + SI in sequence</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleOption} ${localUseOld ? styles.active : ''}`}
              onClick={() => handleFamilyToggle(true)}
              disabled={disabled}
            >
              Old Family
              <span className={styles.toggleOptionHint}>Manual HR + SI</span>
            </button>
          </div>
        </div>

        {localUseOld && (
          <div className={styles.oldNewsletterSection}>
            <div className={styles.oldNewsletterHeader}>
              <span className={styles.oldNewsletterTitle}>Old Newsletter Family</span>
              <span className={styles.oldNewsletterHint}>HR and SI - manual IDs</span>
            </div>
            <div className={styles.oldNewsletterRow}>
              {(['HR', 'SI'] as const).map(slug => (
                <div key={slug} className={styles.oldNewsletterField}>
                  <label>{slug} Template ID:</label>
                  <input
                    type="text"
                    value={ids[slug]}
                    onChange={e => handleIdChange(slug, e.target.value)}
                    placeholder={`Enter ${slug} template ID`}
                    className={styles.inputSmall}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  },
);

NewsletterFamily.displayName = 'NewsletterFamily';

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export const Sidebar = memo(
  ({
    campaign,
    campaignName,
    chdeTemplateId,
    selectedSlugs,
    previewImage,
    dateWarning,
    isLoadingTranslations,
    isGenerating,
    isLoadingTabs,
    availableTabs,
    customTemplates,
    oldNewsletterFamilyIds,
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
    customDate,
    effectiveCampaignName,
    isCustomDateActive,
    isCustomDatePending,
    customDateError,
    onSetCustomDate,
    onClearCustomDate,
  }: SidebarProps & CustomDateProps) => {
    const handleClosePreview = useCallback(() => onSetPreviewImage(null), [onSetPreviewImage]);

    return (
      <div className={styles.sidebar}>
        <CampaignSelector
          campaignName={campaignName}
          availableTabs={availableTabs ?? EMPTY_TABS}
          isLoadingTabs={isLoadingTabs}
          isLoadingTranslations={isLoadingTranslations}
          dateWarning={dateWarning}
          onSetCampaignName={onSetCampaignName}
          isGenerating={isGenerating}
          customDate={customDate}
          effectiveCampaignName={effectiveCampaignName}
          isCustomDateActive={isCustomDateActive}
          isCustomDatePending={isCustomDatePending}
          customDateError={customDateError}
          onSetCustomDate={onSetCustomDate}
          onClearCustomDate={onClearCustomDate}
        />

        <BigImagePreview
          src={previewImage?.src || null}
          alt={previewImage?.alt || 'Preview'}
          onClose={handleClosePreview}
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

        <NewsletterFamily
          useOldFamily={useOldNewsletterFamily}
          hrId={oldNewsletterFamilyIds?.HR}
          siId={oldNewsletterFamilyIds?.SI}
          disabled={isGenerating || isLoadingTranslations}
          onUseOldNewsletterFamily={onUseOldNewsletterFamily}
          onOldNewsletterIdsChange={onOldNewsletterIdsChange}
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
  },
);

Sidebar.displayName = 'Sidebar';
