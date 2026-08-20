import DatePicker from 'react-datepicker';
import updaterStyles from '../../styles/updater.module.scss';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { getFlagUrl } from '@/entrypoints/issue.content/utils/updater/flag';
import { JSX } from 'react';
import React from 'react';
import { SHOP_ID_MAP } from '../../lib/shopConfig';
import { TableRowProps } from '@/entrypoints/issue.content/types/Updater';

export const TableRow = ({
  slug,
  subjectLine,
  pageTitle,
  hasSL,
  hasPT,
  deactivateDate,
  lp,
  lpB,
  fdMode,
  mdMode,
  isSLSelected,
  isPTSelected,
  loading,
  useGlobalLP,
  useGlobalDates,
  newsletterId,
  landingPageId,
  onToggleCountry,
  onToggleSL,
  onTogglePT,
  onFDModeChange,
  onMDModeChange,
  onLPChange,
  onLPBChange,
  onDeactivateDateChange,
  isUpdating = false,
  isSuccess = false,
  isError = false,
  errorMessage,
  disableSelections = false,
  verificationResult,
  verifying = false
}: TableRowProps) => {
  const rowClass = clsx(updaterStyles.shopRow, {
    [updaterStyles.rowUpdating]: isUpdating,
    [updaterStyles.rowSuccess]: isSuccess,
    [updaterStyles.rowError]: isError,
    [updaterStyles.rowFD]: fdMode,
    [updaterStyles.rowMD]: mdMode,
    [updaterStyles.rowSelected]: isSLSelected || isPTSelected,
  });

  const renderNewsletterIds = () => {
    if (!newsletterId) return null;

    const links: JSX.Element[] = [];

    if (newsletterId.aId) {
      links.push(
        <a
          key={`a-${newsletterId.aId}`}
          href={`https://www.prologistics.info/news_email.php?id=${newsletterId.aId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={updaterStyles.idLink}
        >
          {newsletterId.aId}
        </a>,
      );
    }

    if (newsletterId.bId) {
      links.push(
        <React.Fragment key={`b-${newsletterId.bId}`}>
          {links.length > 0 && <span className={updaterStyles.idSeparator}> | </span>}
          <a
            href={`https://www.prologistics.info/news_email.php?id=${newsletterId.bId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={updaterStyles.idLink}
          >
            {newsletterId.bId}
          </a>
        </React.Fragment>,
      );
    }

    return links.length > 0 ? links : null;
  };

    const renderLandingPageIds = () => {
    if (!landingPageId) return null;

    const links: JSX.Element[] = [];

    if (landingPageId.aId) {
      links.push(
        <a
          key={`a-${landingPageId.aId}`}
          href={getLpLink(landingPageId.aId, slug) || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={updaterStyles.idLink}
        >
          {landingPageId.aId}
        </a>,
      );
    }

    if (landingPageId.bId) {
      links.push(
        <React.Fragment key={`b-${landingPageId.bId}`}>
          {links.length > 0 && <span className={updaterStyles.idSeparator}> | </span>}
          <a
            href={getLpLink(landingPageId.bId, slug) || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={updaterStyles.idLink}
          >
            {landingPageId.bId}
          </a>
        </React.Fragment>,
      );
    }

    return links.length > 0 ? links : null;
  };

  const isTranslationNotFound = (text: string) => {
    return text === 'TRANSLATION NOT FOUND';
  };


   const renderText = (text: string, fallback: string = '-', needsUpdate: boolean = false) => {
    const displayText = text || fallback;
    if (displayText === 'TRANSLATION NOT FOUND') {
      return <span className={updaterStyles.translationNotFound}>{displayText}</span>;
    }
    if (needsUpdate) {
      return (
        <span className={updaterStyles.needsUpdate}>
          {displayText}
          <span className={updaterStyles.updateIndicator} title="Newer version available in spreadsheet">
            <Icon icon="mdi:arrow-up-circle" width="14" height="14" />
          </span>
        </span>
      );
    }
    return <span>{displayText}</span>;
  };

  const getLpLink = (landingPageId: string, slug: string): string | null => {
    if (!landingPageId) return null;
    const shopId = SHOP_ID_MAP[slug as keyof typeof SHOP_ID_MAP];
    if (!shopId) return null;
    return `https://www.prologistics.info/shop_content.php?id=${landingPageId}&shop_id=${shopId}`;
  };

  const flagUrl = getFlagUrl(slug);
  const hasABLp = !!(landingPageId?.aId && landingPageId?.bId);

  return (
    <div className={rowClass}>
      {/* Country Column */}
      <div className={updaterStyles.shopLabel}>
        <input
          type="checkbox"
          checked={isSLSelected || isPTSelected}
          onChange={e => onToggleCountry(e.target.checked)}
          disabled={loading || isUpdating || disableSelections}
        />
        {flagUrl && <img src={flagUrl} alt={`${slug} flag`} className={updaterStyles.flagIcon} />}
        <span>{slug}</span>
        {isUpdating && <Icon icon="svg-spinners:180-ring" width="14" height="14" className={updaterStyles.spinner} />}
        {isSuccess && <Icon icon="mdi:check-circle" width="14" height="14" className={updaterStyles.successIcon} />}
        {isError && <Icon icon="mdi:alert-circle" width="14" height="14" className={updaterStyles.errorIcon} />}
        {isError && errorMessage && (
          <span className={updaterStyles.errorTooltip} title={errorMessage}>
            <Icon icon="mdi:information" width="12" height="12" />
          </span>
        )}
      </div>

      <div className={updaterStyles.newsletterId}>
        {renderNewsletterIds() || <span className={updaterStyles.idText}>-</span>}
      </div>

      {/* Subject Line Column */}
       <div className={updaterStyles.subjectLine}>
        {verifying ? (
          <span className={updaterStyles.verifying}>
            <Icon icon="svg-spinners:180-ring" width="14" height="14" />
          </span>
        ) : (
          renderText(subjectLine, '-', verificationResult?.subjectNeedsUpdate)
        )}
        {hasSL && (
          <input
            type="checkbox"
            checked={isSLSelected}
            onChange={e => onToggleSL(e.target.checked)}
            disabled={loading || disableSelections}
            title="Select subject line for update"
          />
        )}
      </div>

      <div className={updaterStyles.landingPageId}>
        {renderLandingPageIds() || <span className={updaterStyles.idText}>-</span>}
      </div>

      {/* Page Title Column */}
     <div className={updaterStyles.pageTitle}>
        {verifying ? (
          <span className={updaterStyles.verifying}>
            <Icon icon="svg-spinners:180-ring" width="14" height="14" />
          </span>
        ) : (
          renderText(pageTitle, '-', verificationResult?.pageTitleNeedsUpdate)
        )}
        {hasPT && (
          <input
            type="checkbox"
            checked={isPTSelected}
            onChange={e => onTogglePT(e.target.checked)}
            disabled={loading || isUpdating || disableSelections}
            title="Select page title for update"
          />
        )}
      </div>

      {/* FD/MD Column */}
      <div className={updaterStyles.fdMd}>
        <label className={`${updaterStyles.checkboxLabel} ${mdMode ? updaterStyles.disabled : ''}`}>
          <input
            type="checkbox"
            checked={fdMode}
            onChange={e => onFDModeChange(e.target.checked)}
            disabled={loading || mdMode || disableSelections}
          />
          <span className={fdMode ? updaterStyles.fdActive : ''}>FD</span>
        </label>
        <label className={`${updaterStyles.checkboxLabel} ${fdMode ? updaterStyles.disabled : ''}`}>
          <input
            type="checkbox"
            checked={mdMode}
            onChange={e => onMDModeChange(e.target.checked)}
            disabled={loading || fdMode || disableSelections}
          />
          <span className={mdMode ? updaterStyles.mdActive : ''}>MD</span>
        </label>
      </div>

      {/* Landing Page Column (conditional) */}
      {!useGlobalLP && (
        <div className={updaterStyles.landingPage}>
          <input
            type="text"
            value={lp || ''}
            onChange={e => onLPChange(e.target.value)}
            disabled={loading}
            placeholder={hasABLp ? 'lp26-04-05 (A)' : 'lp26-04-05'}
            className={updaterStyles.lpInput}
          />
          {hasABLp && (
            <input
              type="text"
              value={lpB || ''}
              onChange={e => onLPBChange?.(e.target.value)}
              disabled={loading}
              placeholder="lp26-04-05 (B)"
              className={updaterStyles.lpInput}
            />
          )}
        </div>
      )}

      {/* Date Columns (conditional) */}
      {!useGlobalDates && (
        <div className={updaterStyles.deactivateDate}>
          <DatePicker
            selected={deactivateDate}
            onChange={onDeactivateDateChange}
            dateFormat="yyyy-MM-dd"
            disabled={loading}
            minDate={new Date()}
            placeholderText="Select deactivate date"
          />
        </div>
      )}
    </div>
  );
};
 