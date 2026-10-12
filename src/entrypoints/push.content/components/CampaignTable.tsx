import { type Dispatch, memo, type SetStateAction, useMemo } from 'react';
import { BASE_SLUG_CONFIG } from '../helpers/slugMapper';
import { useStableCallback } from '../helpers/useStableCallback';
import { ImagePreview } from './ImagePreview';
import { InlineEdit } from './InlineEdit';
import styles from '../push.module.scss';
import {
  type CampaignRowData,
  type CampaignTableProps,
  type CustomImage,
  type CustomLpPath,
  type CustomTemplate,
} from '../types/push';

/* ------------------------------------------------------------------ */
/* Field keys & columns                                                */
/* ------------------------------------------------------------------ */

const FIELD = {
  image: "[name='image']",
  icon: "[name='icon']",
  clickAction: "[name='click_action']",
  template: "[name='template']",
  lpPath: "[name='lp_path']",
  title: "[name='title']",
  body: "[name='body']",
  language: "[name='language[]']",
  ctaLang: "[name='cta_lang']",
  shop: "[name='shop']",
} as const;

/** Not rendered as own columns (language + cta_lang go to the "Languages" column). */
const HIDDEN_FIELDS = new Set<string>([FIELD.shop, FIELD.language, FIELD.ctaLang]);

const COLUMN_META: Record<string, { label: string; className: string }> = {
  [FIELD.image]: { label: 'Image', className: styles.colImage },
  [FIELD.icon]: { label: 'Icon', className: styles.colImage },
  [FIELD.clickAction]: { label: 'Target URL', className: styles.colUrl },
  [FIELD.title]: { label: 'Title', className: styles.colText },
  [FIELD.body]: { label: 'Message', className: styles.colText },
  [FIELD.template]: { label: 'Template', className: styles.colTemplate },
  [FIELD.lpPath]: { label: 'LP Path', className: styles.colPath },
};

interface Column {
  key: string;
  label: string;
  className: string;
}

const buildColumns = (headers: string[]): Column[] =>
  headers
    .filter(key => !HIDDEN_FIELDS.has(key))
    .map(key => ({
      key,
      ...(COLUMN_META[key] ?? { label: key.replace(/[[\]']/g, ''), className: styles.colDefault }),
    }));

/* ------------------------------------------------------------------ */
/* Pure helpers (logic unchanged)                                      */
/* ------------------------------------------------------------------ */

const extractCampaignName = (fullName: string): string => {
  const match = fullName.match(/(\d{2}[.-]\d{2}[.-]\d{2,4})/);
  if (!match) return fullName;

  const dateIndex = match.index || 0;
  const afterDate = fullName
    .substring(dateIndex + match[0].length)
    .trim()
    .replace(/^[\s-]+/, '');
  if (afterDate) return afterDate;

  return fullName.substring(0, dateIndex).trim().replace(/[\s-]+$/, '');
};

const getUtmCampaign = (fullName: string): string => extractCampaignName(fullName).toLowerCase().replace(/\s+/g, '+');

const isTranslationMissing = (value: string): boolean => {
  const trimmed = (value || '').trim();
  return trimmed === '' || trimmed === 'TRANSLATION NOT FOUND';
};

/** A slug is shown only when both title and message exist. */
const hasValidTranslations = (rowData: CampaignRowData): boolean =>
  !isTranslationMissing(rowData[FIELD.title] || '') && !isTranslationMissing(rowData[FIELD.body] || '');

const extractDomainAndPath = (url: string): string =>
  url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('?')[0];

const TranslationWarning = ({ type }: { type: 'title' | 'message' }) => (
  <span className={styles.translationMissing}>⚠️ {type === 'title' ? 'Title' : 'Message'} not found</span>
);

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

type PreviewImage = { src: string; alt: string } | null;

/** All handlers have a permanent identity (see useStableCallback), so they never break row memoization. */
interface RowActions {
  toggleCustomImage: (slug: string) => void;
  saveCustomImage: (slug: string, url?: string) => void;
  toggleCustomLpPath: (slug: string) => void;
  saveCustomLpPath: (slug: string, value?: string) => void;
  setPreviewImage: Dispatch<SetStateAction<PreviewImage>>;
  testRow: (slug: string) => void;
  sendRow: (slug: string) => void;
}

interface CampaignRowProps {
  slug: string;
  rowData: CampaignRowData;
  columns: Column[];
  campaignName: string;
  utmCampaign: string;
  isActive: boolean;
  isBusy: boolean;
  /** Only this row's slice of the custom maps — editing one row no longer re-renders all of them. */
  customImage?: CustomImage;
  customTemplate?: CustomTemplate;
  customLpPath?: CustomLpPath;
  actions: RowActions;
}

const CampaignRow = memo(
  ({
    slug,
    rowData,
    columns,
    campaignName,
    utmCampaign,
    isActive,
    isBusy,
    customImage,
    customTemplate,
    customLpPath,
    actions,
  }: CampaignRowProps) => {
    const upperSlug = slug.toUpperCase();
    const hasTitle = !isTranslationMissing(rowData[FIELD.title] || '');
    const hasMessage = !isTranslationMissing(rowData[FIELD.body] || '');

    const isCustomImageEnabled = customImage?.enabled || false;
    const isImageEditing = customImage?.isEditing || false;
    const isLpEditing = customLpPath?.isEditing || false;

    const renderCell = (key: string, className: string) => {
      const value = rowData[key] || '';

      switch (key) {
        case FIELD.template: {
          const templateId = customTemplate?.value || value;
          return (
            <td key={key} className={className}>
              <div className={styles.cellWrapper}>
                <div className={styles.displayContainer}>
                  <a
                    href={`${window.location.origin}/news_email.php?id=${templateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.linkAction}
                  >
                    {templateId}
                  </a>
                </div>
              </div>
            </td>
          );
        }

        case FIELD.lpPath:
          return (
            <td key={key} className={className}>
              <div className={styles.cellWrapper}>
                {isLpEditing ? (
                  <InlineEdit
                    initialValue={customLpPath?.value || value}
                    placeholder="Enter LP path"
                    onSave={v => actions.saveCustomLpPath(slug, v)}
                    onCancel={() => actions.toggleCustomLpPath(slug)}
                  />
                ) : (
                  <div className={styles.displayContainer}>
                    <span className={styles.textTruncate}>{customLpPath?.value || value}</span>
                    <button
                      type="button"
                      onClick={() => actions.toggleCustomLpPath(slug)}
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

        case FIELD.clickAction: {
          const domain = BASE_SLUG_CONFIG[slug]?.domain || '';
          const lpPath = customLpPath?.value || rowData[FIELD.lpPath] || campaignName;
          const fullUrl = `https://www.beliani.${domain}/content/${lpPath}/?utm_source=PUSH&utm_medium=${lpPath}&utm_campaign=${utmCampaign}`;
          return (
            <td key={key} className={className}>
              <a href={fullUrl} target="_blank" rel="noopener noreferrer" className={styles.linkAction} title={fullUrl}>
                {extractDomainAndPath(fullUrl)}
              </a>
            </td>
          );
        }

        case FIELD.title:
          return (
            <td key={key} className={className}>
              {hasTitle ? <span className={styles.textTruncate}>{value}</span> : <TranslationWarning type="title" />}
            </td>
          );

        case FIELD.body:
          return (
            <td key={key} className={className}>
              {hasMessage ? <span className={styles.textTruncate}>{value}</span> : <TranslationWarning type="message" />}
            </td>
          );

        case FIELD.image: {
          const src = customImage?.enabled && !customImage.isEditing && customImage.url ? customImage.url : value;
          return (
            <td key={key} className={className}>
              {src && (
                <ImagePreview
                  src={src}
                  alt={`Push image for ${slug}`}
                  size="small"
                  onClick={() => actions.setPreviewImage({ src, alt: `Push Image - ${upperSlug}` })}
                />
              )}
            </td>
          );
        }

        case FIELD.icon:
          return (
            <td key={key} className={className}>
              {value && (
                <ImagePreview
                  src={value}
                  alt={`Icon for ${slug}`}
                  size="small"
                  onClick={() => actions.setPreviewImage({ src: value, alt: `Icon - ${upperSlug}` })}
                />
              )}
            </td>
          );

        default:
          return (
            <td key={key} className={className}>
              {value && <span className={styles.textTruncate}>{value}</span>}
            </td>
          );
      }
    };

    return (
      <tr
        className={`${isActive ? styles.activeRow : ''} ${!hasTitle || !hasMessage ? styles.warningRow : ''}`}
      >
        <td className={styles.colSlug}>{upperSlug}</td>

        {columns.map(col => renderCell(col.key, col.className))}

        <td className={styles.colLanguages}>
          <div className={styles.languagesContainer}>
            <span className={styles.languageItem}>{rowData[FIELD.language] || '-'}</span>
            <span className={styles.languageItem}>{rowData[FIELD.ctaLang] || '-'}</span>
          </div>
        </td>

        <td className={styles.colCustomImage}>
          <div className={styles.cellWrapper}>
            <div className={styles.customImageContainer}>
              <label className={styles.customImageLabel}>
                <input
                  type="checkbox"
                  checked={isCustomImageEnabled}
                  onChange={() => actions.toggleCustomImage(slug)}
                  disabled={isBusy}
                />
                Custom
              </label>
              {isCustomImageEnabled && isImageEditing && (
                <InlineEdit
                  // Prefill with the saved custom URL, otherwise the current sheet image.
                  initialValue={customImage?.url || rowData[FIELD.image] || ''}
                  placeholder="Enter image URL"
                  onSave={url => actions.saveCustomImage(slug, url)}
                />
              )}
            </div>
          </div>
        </td>

        <td className={styles.colActions}>
          <div className={styles.tableActionBtns}>
            <button type="button" onClick={() => actions.testRow(slug)} disabled={isBusy} className={styles.btnRowTest}>
              Test
            </button>
            <button type="button" onClick={() => actions.sendRow(slug)} disabled={isBusy} className={styles.btnRowSend}>
              Send
            </button>
          </div>
        </td>
      </tr>
    );
  },
);

CampaignRow.displayName = 'CampaignRow';

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

export const CampaignTable = memo((props: CampaignTableProps) => {
  const {
    campaign,
    activeSlug,
    busySlug,
    isRandomTesting,
    isSendingAll,
    campaignName,
    customImages,
    customTemplates,
    customLpPaths,
  } = props;

  // Stable wrappers: rows keep the same handler identities no matter how the parent creates them.
  const toggleCustomImage = useStableCallback(props.onToggleCustomImage);
  const saveCustomImage = useStableCallback(props.onSaveCustomImage);
  const toggleCustomLpPath = useStableCallback(props.onToggleCustomLpPath);
  const saveCustomLpPath = useStableCallback(props.onSaveCustomLpPath);
  const setPreviewImage = useStableCallback(props.onSetPreviewImage);
  const testRow = useStableCallback(props.onTestRow);
  const sendRow = useStableCallback(props.onSendRow);

  const actions = useMemo<RowActions>(
    () => ({
      toggleCustomImage,
      saveCustomImage,
      toggleCustomLpPath,
      saveCustomLpPath,
      setPreviewImage,
      testRow,
      sendRow,
    }),
    [toggleCustomImage, saveCustomImage, toggleCustomLpPath, saveCustomLpPath, setPreviewImage, testRow, sendRow],
  );

  const data = campaign?.data;

  // Columns + filtering are computed once per campaign data, not on every render.
  const { columns, visibleEntries, totalCount } = useMemo(() => {
    const entries = data ? Object.entries(data) : [];
    const firstRow = entries[0]?.[1];
    return {
      columns: firstRow ? buildColumns(Object.keys(firstRow)) : [],
      visibleEntries: entries.filter(([, rowData]) => hasValidTranslations(rowData)),
      totalCount: entries.length,
    };
  }, [data]);

  const utmCampaign = useMemo(() => getUtmCampaign(campaignName), [campaignName]);

  if (totalCount === 0) return null;

  if (visibleEntries.length === 0) {
    return (
      <div className={styles.emptyTranslations}>
        <p>No valid translations found for any slug.</p>
        <p className={styles.hint}>Please check if the campaign has translations for the selected slugs.</p>
      </div>
    );
  }

  const isBusy = !!busySlug || isRandomTesting || isSendingAll;
  const hiddenCount = totalCount - visibleEntries.length;

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colSlug}>Slug</th>
              {columns.map(col => (
                <th key={col.key} className={col.className}>
                  {col.label}
                </th>
              ))}
              <th className={styles.colLanguages}>Languages</th>
              <th className={styles.colCustomImage}>Custom Image</th>
              <th className={styles.colActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.map(([slug, rowData]) => (
              <CampaignRow
                key={slug}
                slug={slug}
                rowData={rowData}
                columns={columns}
                campaignName={campaignName}
                utmCampaign={utmCampaign}
                isActive={activeSlug === slug}
                isBusy={isBusy}
                customImage={customImages[slug]}
                customTemplate={customTemplates[slug]}
                customLpPath={customLpPaths[slug]}
                actions={actions}
              />
            ))}
          </tbody>
        </table>
        {hiddenCount > 0 && (
          <div className={styles.filteredNotice}>
            <span>
              Showing {visibleEntries.length} of {totalCount} slugs ({hiddenCount} hidden - missing translations)
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

CampaignTable.displayName = 'CampaignTable';
