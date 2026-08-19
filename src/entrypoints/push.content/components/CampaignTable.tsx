import { Dispatch, memo, SetStateAction } from 'react';
import { BASE_SLUG_CONFIG } from '../helpers/slugMapper';
import { ImagePreview } from './ImagePreview';
import styles from '../push.module.scss';
import { CampaignRowData, CampaignTableProps, CustomImage, CustomLpPath, CustomTemplate } from '../types/push';



const extractCampaignName = (fullName: string): string => {
  const datePattern = /(\d{2}[\.\-]\d{2}[\.\-]\d{2,4})/;
  const match = fullName.match(datePattern);

  if (match) {
    const dateIndex = match.index || 0;
    const dateEndIndex = dateIndex + match[0].length;
    let afterDate = fullName.substring(dateEndIndex).trim();
    afterDate = afterDate.replace(/^[\s\-]+/, '');
    if (afterDate) {
      return afterDate;
    }
    const beforeDate = fullName.substring(0, dateIndex).trim();
    return beforeDate.replace(/[\s\-]+$/, '');
  }
  return fullName;
};

const getUtmCampaign = (fullName: string): string => {
  const campaign = extractCampaignName(fullName);
  return campaign.toLowerCase().replace(/\s+/g, '+');
};

const TranslationWarning = ({ type }: { type: 'title' | 'message' }) => {
  return <span className={styles.translationMissing}>⚠️ {type === 'title' ? 'Title' : 'Message'} not found</span>;
};

const isTranslationMissing = (value: string): boolean => {
  return !value || value.trim() === '' || value.trim() === 'TRANSLATION NOT FOUND';
};

// Check if a slug has valid translations (both title and message should exist)
const hasValidTranslations = (rowData: CampaignRowData): boolean => {
  const titleValue = rowData["[name='title']"] || '';
  const bodyValue = rowData["[name='body']"] || '';
  const hasTitle = !isTranslationMissing(titleValue);
  const hasMessage = !isTranslationMissing(bodyValue);
  return hasTitle && hasMessage;
};

const extractDomainAndPath = (url: string): string => {
  try {
    let cleaned = url.replace(/^https?:\/\//, '');
    cleaned = cleaned.replace(/^www\./, '');
    return cleaned.split('?')[0];
  } catch {
    return url;
  }
};

const CampaignRow = memo(
  ({
    slug,
    rowData,
    activeSlug,
    busySlug,
    isRandomTesting,
    isSendingAll,
    campaignName,
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
  }: {
    slug: string;
    rowData: CampaignRowData;
    activeSlug: string | null;
    busySlug: string | null;
    isRandomTesting: boolean;
    isSendingAll: boolean;
    campaignName: string;
    customImages: Record<string, CustomImage>;
    customTemplates: Record<string, CustomTemplate>;
    customLpPaths: Record<string, CustomLpPath>;
    onToggleCustomImage: (slug: string) => void;
    onUpdateCustomImageUrl: (slug: string, url: string) => void;
    onSaveCustomImage: (slug: string, url?: string) => void;
    onToggleCustomTemplate: (slug: string) => void;
    onUpdateCustomTemplateValue: (slug: string, value: string) => void;
    onSaveCustomTemplate: (slug: string) => void;
    onToggleCustomLpPath: (slug: string) => void;
    onUpdateCustomLpPath: (slug: string, value: string) => void;
    onSaveCustomLpPath: (slug: string, value?: string) => void;
    onSetPreviewImage: Dispatch<SetStateAction<{ src: string; alt: string } | null>>;
    onTestRow: (slug: string) => void;
    onSendRow: (slug: string) => void;
  }) => {
    const customImage = customImages[slug];
    const isCustomEnabled = customImage?.enabled || false;
    const customImageUrl = customImage?.url || '';
    const isImageEditing = customImage?.isEditing || false;

    const customTemplate = customTemplates[slug];
    const isTemplateEditing = customTemplate?.isEditing || false;

    const customLpPath = customLpPaths[slug];
    const isLpEditing = customLpPath?.isEditing || false;

    const [lpEditValue, setLpEditValue] = useState(customLpPath?.value || rowData["[name='lp_path']"] || '');
    const [imageEditValue, setImageEditValue] = useState(customImage?.url || '');

    useEffect(() => {
  setImageEditValue(customImage?.url || '');
}, [customImage]);

    const handleLpSave = useCallback(() => {
      if (lpEditValue.trim()) {
        onSaveCustomLpPath(slug, lpEditValue);
      }
    }, [slug, lpEditValue, onSaveCustomLpPath]);

const handleImageSave = useCallback(() => {
  const trimmedUrl = imageEditValue.trim();
  
  if (trimmedUrl) {
    onSaveCustomImage(slug, trimmedUrl);
  }
}, [slug, imageEditValue, onSaveCustomImage]);

    const titleValue = rowData["[name='title']"] || '';
    const bodyValue = rowData["[name='body']"] || '';
    const hasTitle = !isTranslationMissing(titleValue);
    const hasMessage = !isTranslationMissing(bodyValue);

    const utmCampaign = getUtmCampaign(campaignName);

    const language = rowData["[name='language[]']"] || '';
    const ctaLang = rowData["[name='cta_lang']"] || '';

    return (
      <tr
        className={`${activeSlug === slug ? styles.activeRow : ''} ${!hasTitle || !hasMessage ? styles.warningRow : ''}`}
      >
        <td className={styles.colSlug}>{slug.toUpperCase()}</td>

        {Object.entries(rowData).map(([key, value]) => {
          const isImage = key === "[name='image']";
          const isIcon = key === "[name='icon']";
          const isClickAction = key === "[name='click_action']";
          const isTemplate = key === "[name='template']";
          const isLpPath = key === "[name='lp_path']";
          const isTitle = key === "[name='title']";
          const isBody = key === "[name='body']";
          const isLanguage = key === "[name='language[]']";
          const isCtaLang = key === "[name='cta_lang']";
          const isShop = key === "[name='shop']";

          if (isShop || isLanguage || isCtaLang) {
            return null;
          }

          let displayValue = value;
          if (isImage && customImage?.enabled && !customImage.isEditing && customImage.url) {
            displayValue = customImage.url;
          }

          if (isTemplate) {
            const templateId = customTemplate?.value || value;
            const prologisticsUrl = `https://www.prologistics.info/news_email.php?id=${templateId}`;

            return (
              <td key={key} className={styles.colTemplate}>
                <div className={styles.cellWrapper}>
                  <div className={styles.displayContainer}>
                    <a href={prologisticsUrl} target="_blank" rel="noopener noreferrer" className={styles.linkAction}>
                      {templateId}
                    </a>
                  </div>
                </div>
              </td>
            );
          }

          if (isLpPath) {
            return (
              <td key={key} className={styles.colPath}>
                <div className={styles.cellWrapper}>
                  {isLpEditing ? (
                    <div className={styles.editContainer}>
                      <div className={styles.inputWrapper}>
                        <input
                          type="text"
                          value={lpEditValue}
                          onChange={e => setLpEditValue(e.target.value)}
                          placeholder="Enter LP path"
                          className={styles.inputSmall}
                          autoFocus
                        />
                      </div>
                      <div className={styles.iconGroup}>
                        <button
                          onClick={handleLpSave}
                          className={styles.iconSave}
                          disabled={!lpEditValue.trim()}
                          title="Save"
                        >
                          ✓
                        </button>
                        <button onClick={() => onToggleCustomLpPath(slug)} className={styles.iconCancel} title="Cancel">
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.displayContainer}>
                      <span className={styles.textTruncate}>{customLpPath?.value || value}</span>
                      <button
                        onClick={() => {
                          setLpEditValue(customLpPath?.value || value);
                          onToggleCustomLpPath(slug);
                        }}
                        className={styles.iconEdit}
                        title="Edit LP path"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </div>
              </td>
            );
          }

          if (isClickAction) {
            const domain = BASE_SLUG_CONFIG[slug]?.domain || '';
            const currentLpPath = customLpPaths[slug]?.value || rowData["[name='lp_path']"] || campaignName;
            const fullUrl = `https://www.beliani.${domain}/content/${currentLpPath}/?utm_source=PUSH&utm_medium=${currentLpPath}&utm_campaign=${utmCampaign}`;
            const displayUrl = extractDomainAndPath(fullUrl);

            return (
              <td key={key} className={styles.colUrl}>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkAction}
                  title={fullUrl}
                >
                  {displayUrl}
                </a>
              </td>
            );
          }

          if (isTitle) {
            return (
              <td key={key} className={styles.colText}>
                {hasTitle ? <span className={styles.textTruncate}>{value}</span> : <TranslationWarning type="title" />}
              </td>
            );
          }

          if (isBody) {
            return (
              <td key={key} className={styles.colText}>
                {hasMessage ? (
                  <span className={styles.textTruncate}>{value}</span>
                ) : (
                  <TranslationWarning type="message" />
                )}
              </td>
            );
          }

          return (
            <td key={key} className={isImage || isIcon ? styles.colImage : styles.colDefault}>
              {isImage && displayValue && (
                <ImagePreview
                  src={displayValue}
                  alt={`Push image for ${slug}`}
                  size="small"
                  onClick={() => onSetPreviewImage({ src: displayValue, alt: `Push Image - ${slug.toUpperCase()}` })}
                />
              )}
              {isIcon && value && (
                <ImagePreview
                  src={value}
                  alt={`Icon for ${slug}`}
                  size="small"
                  onClick={() => onSetPreviewImage({ src: value, alt: `Icon - ${slug.toUpperCase()}` })}
                />
              )}
              {!isImage && !isIcon && !isTemplate && !isLpPath && !isClickAction && !isTitle && !isBody && value && (
                <span className={styles.textTruncate}>{value}</span>
              )}
            </td>
          );
        })}

        <td key="languages" className={styles.colLanguages}>
          <div className={styles.languagesContainer}>
            <span className={styles.languageItem}>{language || '-'}</span>
            <span className={styles.languageItem}>{ctaLang || '-'}</span>
          </div>
        </td>

       <td className={styles.colCustomImage}>
  <div className={styles.cellWrapper}>
    <div className={styles.customImageContainer}>
      <label className={styles.customImageLabel}>
        <input
          type="checkbox"
          checked={isCustomEnabled}
          onChange={() => {
            if (!isCustomEnabled) {
              const currentImageUrl = rowData["[name='image']"] || '';
              setImageEditValue(currentImageUrl);
              onToggleCustomImage(slug);
            } else {
              onToggleCustomImage(slug);
            }
          }}
          disabled={isRandomTesting || isSendingAll || !!busySlug}
        />
        Custom
      </label>
     {isCustomEnabled && isImageEditing && (
  <div className={styles.editContainer}>
    <div className={styles.inputWrapper}>
      <input
        type="text"
        value={imageEditValue}
        onChange={e => setImageEditValue(e.target.value)}
        placeholder="Enter image URL"
        className={styles.inputSmall}
      />
    </div>
    <div className={styles.iconGroup}>
      <button
        onClick={handleImageSave}
        className={styles.iconSave}
        disabled={!imageEditValue.trim()}
        title="Save"
      >
        ✓
      </button>
    </div>
  </div>
)}
    </div>
  </div>
</td>

        <td className={styles.colActions}>
          <div className={styles.tableActionBtns}>
            <button
              onClick={() => onTestRow(slug)}
              disabled={!!busySlug || isRandomTesting || isSendingAll}
              className={styles.btnRowTest}
            >
              Test
            </button>
            <button
              onClick={() => onSendRow(slug)}
              disabled={!!busySlug || isRandomTesting || isSendingAll}
              className={styles.btnRowSend}
            >
              Send
            </button>
          </div>
        </td>
      </tr>
    );
  },
);

CampaignRow.displayName = 'CampaignRow';

export const CampaignTable = memo(
  ({
    campaign,
    activeSlug,
    busySlug,
    isRandomTesting,
    isSendingAll,
    campaignName,
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
  }: CampaignTableProps) => {
    if (!campaign || Object.keys(campaign.data).length === 0) {
      return null;
    }

    const filteredEntries = Object.entries(campaign.data)
      .filter(([slug, rowData]) => {
        const hasValid = hasValidTranslations(rowData);
        return hasValid;
      });

    if (filteredEntries.length === 0) {
      return (
        <div className={styles.emptyTranslations}>
          <p>No valid translations found for any slug.</p>
          <p className={styles.hint}>Please check if the campaign has translations for the selected slugs.</p>
        </div>
      );
    }

    const headers = Object.keys(Object.values(campaign.data)[0]);

    return (
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.colSlug}>Slug</th>
                {headers.map(header => {
                  let displayName = header;
                  let colClass = styles.colDefault;

                  if (header === "[name='shop']" || header === "[name='language[]']" || header === "[name='cta_lang']") {
                    return null;
                  }

                  if (header === "[name='image']") {
                    displayName = 'Image';
                    colClass = styles.colImage;
                  } else if (header === "[name='icon']") {
                    displayName = 'Icon';
                    colClass = styles.colImage;
                  } else if (header === "[name='click_action']") {
                    displayName = 'Target URL';
                    colClass = styles.colUrl;
                  } else if (header === "[name='title']") {
                    displayName = 'Title';
                    colClass = styles.colText;
                  } else if (header === "[name='body']") {
                    displayName = 'Message';
                    colClass = styles.colText;
                  } else if (header === "[name='template']") {
                    displayName = 'Template';
                    colClass = styles.colTemplate;
                  } else if (header === "[name='lp_path']") {
                    displayName = 'LP Path';
                    colClass = styles.colPath;
                  } else {
                    displayName = header.replace(/[\[\]']/g, '');
                    colClass = styles.colDefault;
                  }

                  return (
                    <th key={header} className={colClass}>
                      {displayName}
                    </th>
                  );
                })}
                <th className={styles.colLanguages}>Languages</th>
                <th className={styles.colCustomImage}>Custom Image</th>
                <th className={styles.colActions}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(([slug, rowData]) => (
                <CampaignRow
                  key={slug}
                  slug={slug}
                  rowData={rowData}
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
              ))}
            </tbody>
          </table>
          {Object.keys(campaign.data).length !== filteredEntries.length && (
            <div className={styles.filteredNotice}>
              <span>
                Showing {filteredEntries.length} of {Object.keys(campaign.data).length} slugs 
                ({Object.keys(campaign.data).length - filteredEntries.length} hidden - missing translations)
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);
CampaignTable.displayName = 'CampaignTable';
