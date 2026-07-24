import { Dispatch, SetStateAction } from 'react';
import { BigImagePreview } from './BigImagePreview';
import { CampaignTable } from './CampaignTable';
import {
  generateImageUrl,
  generateLpPath,
  isValidTemplateId,
  parseCampaignName,
  SLUG_ORDER,
} from '../helpers/slugMapper';
import styles from '../push.module.scss';

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
}: DashboardContentProps) => {
  const parsedDate = campaignName ? parseCampaignName(campaignName) : null;

  return (
    <div className={styles.dashboardOverlay}>
      <button onClick={onHideOverlay} className={styles.closeButton}>
        ✕ Close
      </button>
      <div className={styles.dashboardLayout}>
        {/* Left Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.fieldGroup}>
            <label>Campaign Name (for URL generation):</label>
            <input
              type="text"
              placeholder="e.g., 24.07.26 - Garden Storage"
              value={campaignName}
              onChange={e => onSetCampaignName(e.target.value)}
              className={styles.input}
            />
            {dateWarning && <div className={styles.dateWarning}>{dateWarning}</div>}
            {campaignName && parsedDate && (
              <div className={styles.metaRowInfo}>
                <span>📅 Date: {parsedDate.date}</span>
                <span>🔢 Version: {parsedDate.version}</span>
                <span>🖼️ Image: {generateImageUrl(campaignName)}</span>
                <span>🔗 LP Path: {generateLpPath(campaignName)}</span>
                {!parsedDate.hasDate && <span>⚠️ No date in name</span>}
              </div>
            )}
            {isLoadingTranslations && <div className={styles.loadingIndicator}>Loading translations...</div>}
          </div>

          <BigImagePreview
            src={previewImage?.src || null}
            alt={previewImage?.alt || 'Preview'}
            onClose={() => onSetPreviewImage(null)}
          />

          <div className={styles.chdeRow}>
            <span className={styles.chdeLabel}>CHDE Template ID:</span>
            <input
              type="text"
              value={chdeTemplateId}
              onChange={e => onSetChdeTemplateId(e.target.value)}
              placeholder="Enter CHDE template ID"
              className={styles.input}
            />
            <button
              onClick={onGenerateAll}
              disabled={
                !campaignName ||
                !campaignName.trim() ||
                !isValidTemplateId(chdeTemplateId) ||
                isGenerating ||
                isLoadingTranslations
              }
              className={styles.btnGenerate}
            >
              {isGenerating ? 'Generating...' : isLoadingTranslations ? 'Loading...' : 'Generate All'}
            </button>
          </div>

          <div className={styles.slugSection}>
            <div className={styles.slugToolbar}>
              <button onClick={onSelectAll} className={styles.btnSelect}>
                Select All
              </button>
              <button onClick={onDeselectAll} className={styles.btnSelect}>
                Deselect All
              </button>
              <span className={styles.selectedCount}>{selectedSlugs.length} selected</span>
            </div>
            <div className={styles.slugGrid}>
              {SLUG_ORDER.map(slug => (
                <label
                  key={slug}
                  className={`${styles.slugChip} ${selectedSlugs.includes(slug) ? styles.selected : ''}`}
                >
                  <input type="checkbox" checked={selectedSlugs.includes(slug)} onChange={() => onToggleSlug(slug)} />
                  {slug}
                </label>
              ))}
            </div>
          </div>

          {campaign && Object.keys(campaign.data).length > 0 && (
            <div className={styles.templatePreviewBox}>
              <span className={styles.title}>Template IDs based on CHDE: {chdeTemplateId}</span>
              <div className={styles.badgeList}>
                {Object.entries(campaign.data).map(([slug, rowData]) => (
                  <span key={slug} className={styles.templateBadge}>
                    {slug.toUpperCase()}: {rowData["[name='template']"]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {!campaign || Object.keys(campaign.data).length === 0 ? (
            <div className={styles.emptyState}>
              {isGenerating ? (
                'Generating campaign...'
              ) : isLoadingTranslations ? (
                'Loading translations...'
              ) : (
                <>
                  No campaign loaded.
                  <br />
                  Enter a campaign name and click "Generate All".
                </>
              )}
            </div>
          ) : (
            <>
              <div className={styles.campaignActions}>
                <button
                  onClick={onTest3Random}
                  disabled={isRandomTesting || isSendingAll || Object.keys(campaign.data).length === 0}
                  className={styles.btnTestRandom}
                >
                  {isRandomTesting ? 'Testing 3 Random...' : '🚀 Test 3 Random'}
                </button>
                <button
                  onClick={onSendAll}
                  disabled={isSendingAll || isRandomTesting || Object.keys(campaign.data).length === 0}
                  className={styles.btnSendAll}
                >
                  {isSendingAll ? 'Sending All...' : '⚠️ Send All'}
                </button>
              </div>

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

              <div className={styles.footerInfo}>
                <span>Total rows: {Object.keys(campaign.data).length}</span>
                <span>Campaign: {campaign.title}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
