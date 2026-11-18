import { Icon } from '@iconify/react';
import { memo, useMemo } from 'react';
import { type CustomDateProps, formatIsoDate } from '../helpers/customDate';
import {
  generateImageUrl,
  generateLpPath,
  getCurrentDate,
  getDefaultImageName,
  normalizeImageName,
  parseCampaignName,
} from '../helpers/slugMapper';
import styles from '../push.module.scss';
import { type CampaignSelectorProps } from '../types/push';

type Props = CampaignSelectorProps &
  CustomDateProps & {
    /** Disables the date field while generating. */
    isGenerating?: boolean;
  };

export const CampaignSelector = memo(
  ({
    campaignName,
    availableTabs,
    isLoadingTabs,
    isLoadingTranslations,
    dateWarning,
    tabsError = null,
    onReloadTabs,
    appendSlugToImage = false,
    isAppendSlugPending = false,
    onSetAppendSlugToImage,
    imageName = '',
    isImageNamePending = false,
    onSetImageName,
    onSetCampaignName,
    isGenerating = false,
    customDate = '',
    effectiveCampaignName,
    isCustomDateActive = false,
    isCustomDatePending = false,
    customDateError = null,
    onSetCustomDate,
    onClearCustomDate,
  }: Props) => {
    // Everything shown here follows the date that will actually be used.
    const sourceName = effectiveCampaignName || campaignName;

    const meta = useMemo(() => {
      if (!sourceName) return null;
      const parsed = parseCampaignName(sourceName);
      if (!parsed) return null;
      return {
        parsed,
        imageUrl: generateImageUrl(sourceName, appendSlugToImage ? '{slug}' : '', imageName),
        defaultImageName: getDefaultImageName(sourceName),
        lpPath: generateLpPath(sourceName),
      };
    }, [sourceName, appendSlugToImage, imageName]);

    const isImageNameActive = !!normalizeImageName(imageName);

    const sortedTabs = useMemo(() => {
      const today = getCurrentDate();
      return availableTabs
        .map((tab, index) => {
          const { date, hasDate } = parseCampaignName(tab);
          return { tab, index, date: hasDate ? date : '', isToday: hasDate && date === today };
        })
        .sort((a, b) => (a.date === b.date ? a.index - b.index : a.date < b.date ? 1 : -1));
    }, [availableTabs]);

    const showDateField = !!campaignName && !!onSetCustomDate;
    const isBusy = isGenerating || isLoadingTranslations;
    const hasTabs = availableTabs.length > 0;
    const showRetry = !!onReloadTabs && !hasTabs && (isLoadingTabs || !!tabsError);

    const placeholder = isLoadingTabs ? 'Loading campaigns...' : hasTabs ? 'Select a campaign' : 'No campaigns loaded';

    const exampleImageName = `pl${normalizeImageName(imageName) || meta?.defaultImageName || 'YYYYMMDDpush'}.png`;

    return (
      <div className={styles.fieldGroup}>
        <label htmlFor="push-campaign-select">Campaign Name:</label>
        <div className={styles.campaignSelectRow}>
          <select
            id="push-campaign-select"
            value={campaignName}
            onChange={e => onSetCampaignName(e.target.value)}
            className={styles.select}
            disabled={!hasTabs || isLoadingTabs}
            aria-busy={isLoadingTabs}
          >
            <option value="">{placeholder}</option>
            {sortedTabs.map(({ tab, isToday }) => (
              <option key={tab} value={tab} className={isToday ? styles.todayOption : undefined}>
                {isToday ? `${tab} (today)` : tab}
              </option>
            ))}
          </select>
          {showRetry && (
            <button
              type="button"
              onClick={onReloadTabs}
              className={`${styles.retryButton} ${tabsError && !isLoadingTabs ? styles.retryButtonError : ''}`}
              title={isLoadingTabs ? 'Loading campaigns...' : 'Retry loading campaigns'}
              aria-label={isLoadingTabs ? 'Loading campaigns' : 'Retry loading campaigns'}
              disabled={isLoadingTabs}
            >
              <Icon
                icon="lucide:refresh-cw"
                width="16"
                height="16"
                className={isLoadingTabs ? styles.spinning : undefined}
              />
            </button>
          )}
        </div>

        {tabsError && !isLoadingTabs && (
          <div className={styles.tabsError} role="alert">
            <Icon icon="lucide:circle-alert" width="14" height="14" />
            <span>{tabsError} Click the retry button to try again.</span>
          </div>
        )}

        {onSetAppendSlugToImage && (
          <label className={styles.appendSlugRow}>
            <input
              type="checkbox"
              checked={appendSlugToImage}
              onChange={e => onSetAppendSlugToImage(e.target.checked)}
              disabled={isBusy}
            />
            <span>Append slug to image name</span>
            <span className={styles.appendSlugHint}>e.g. {exampleImageName}</span>
          </label>
        )}
        {isAppendSlugPending && (
          <div className={styles.dateWarning}>Image name option changed — click "Generate All" to apply it.</div>
        )}

        {campaignName && onSetImageName && (
          <div className={styles.customDateRow}>
            <label className={styles.customDateLabel} htmlFor="push-image-name">
              Image name:
            </label>
            <input
              id="push-image-name"
              type="text"
              value={imageName}
              onChange={e => onSetImageName(e.target.value)}
              placeholder={meta?.defaultImageName ?? 'YYYYMMDDpush'}
              title="Overrides the image file name for all slugs. Leave empty to use the name from the campaign."
              className={styles.inputSmall}
              disabled={isBusy}
            />
            {imageName && (
              <button
                type="button"
                onClick={() => onSetImageName('')}
                className={styles.iconCancel}
                title="Reset to the image name from the campaign name"
                disabled={isBusy}
              >
                ✕
              </button>
            )}
          </div>
        )}
        {isImageNamePending && (
          <div className={styles.dateWarning}>Image name changed — click "Generate All" to apply it.</div>
        )}

        {showDateField && (
          <div className={styles.customDateRow}>
            <label className={styles.customDateLabel} htmlFor="push-custom-date">
              Custom date:
            </label>
            <input
              id="push-custom-date"
              type="date"
              value={customDate}
              onChange={e => onSetCustomDate?.(e.target.value)}
              className={styles.inputSmall}
              disabled={isBusy}
            />
            {customDate && (
              <button
                type="button"
                onClick={onClearCustomDate}
                className={styles.iconCancel}
                title="Reset to the date from the campaign name"
                disabled={isBusy}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {customDateError && <div className={styles.dateWarning}>{customDateError}</div>}
        {isCustomDatePending && (
          <div className={styles.dateWarning}>Date changed — click "Generate All" to apply it.</div>
        )}

        {/* The "no date in name" warning is irrelevant once a custom date is in use. */}
        {dateWarning && !isCustomDateActive && <div className={styles.dateWarning}>{dateWarning}</div>}

        {meta && (
          <div className={styles.metaRowInfo}>
            <span>
              Date: {meta.parsed.date}
              {isCustomDateActive && (
                <span className={styles.customDateBadge} title={`Overridden: ${formatIsoDate(customDate)}`}>
                  custom
                </span>
              )}
            </span>
            <span>Version: {meta.parsed.version}</span>
            <span>LP Path: {meta.lpPath}</span>
            <span className={styles.metaWide}>
              Image: {meta.imageUrl}
              {isImageNameActive && <span className={styles.customDateBadge}>custom</span>}
            </span>
            {!meta.parsed.hasDate && <span>No date in name</span>}
          </div>
        )}
        {isLoadingTranslations && <div className={styles.loadingIndicator}>Loading translations...</div>}
      </div>
    );
  },
);

CampaignSelector.displayName = 'CampaignSelector';
