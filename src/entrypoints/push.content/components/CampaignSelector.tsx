import { memo, useMemo } from 'react';
import { type CustomDateProps, formatIsoDate } from '../helpers/customDate';
import { generateImageUrl, generateLpPath, parseCampaignName } from '../helpers/slugMapper';
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
        imageUrl: generateImageUrl(sourceName),
        lpPath: generateLpPath(sourceName),
      };
    }, [sourceName]);

    const showDateField = !!campaignName && !!onSetCustomDate;
    const isBusy = isGenerating || isLoadingTranslations;

    return (
      <div className={styles.fieldGroup}>
        <label>Campaign Name:</label>
        {isLoadingTabs ? (
          <div className={styles.loadingIndicator}>Loading tabs...</div>
        ) : (
          <select
            value={campaignName}
            onChange={e => onSetCampaignName(e.target.value)}
            className={styles.select}
            disabled={availableTabs.length === 0}
          >
            <option value="">Select a campaign</option>
            {availableTabs.map(tab => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
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
                  {' '}
                  (custom)
                </span>
              )}
            </span>
            <span>Version: {meta.parsed.version}</span>
            <span>Image: {meta.imageUrl}</span>
            <span>LP Path: {meta.lpPath}</span>
            {!meta.parsed.hasDate && <span>No date in name</span>}
          </div>
        )}
        {isLoadingTranslations && <div className={styles.loadingIndicator}>Loading translations...</div>}
      </div>
    );
  },
);

CampaignSelector.displayName = 'CampaignSelector';
