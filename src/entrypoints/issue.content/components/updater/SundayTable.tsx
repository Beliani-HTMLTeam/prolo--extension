import { SundayEmptyState } from './SundayEmptyState';
import { SundayTableSkeleton } from './SundayTableSkeleton';
import sundayStyles from '../../styles/sunday.module.scss';
import clsx from 'clsx';
import { Icon } from '@iconify/react';
import { getFlagUrl } from '@/entrypoints/newtab/utils/updater/flag';
import { SundayTableUpdateSkeleton } from './SundayTableUpdateSkeleton';
import { SundayTableProps } from '@/entrypoints/newtab/types/Updater';
import UpdaterButton from './UpdaterButton';

const SKELETON_ROWS_COUNT = 10;

export const SundayTable = ({
  subjectLines,
  selectedIndex,
  onSelectOption,
  loading,
  availableSlugs = [],
  updatingSlugs = new Set(),
  updateResults = [],
  newsletterIds = {},
  onRetry
}: SundayTableProps) => {
  if (loading || updatingSlugs.size > 0) {
    const rowsCount = availableSlugs.length > 0 ? availableSlugs.length : SKELETON_ROWS_COUNT;
    if (loading) {
      return <SundayTableSkeleton rowsCount={rowsCount} />;
    }
    return <SundayTableUpdateSkeleton rowsCount={rowsCount} availableSlugs={availableSlugs} />;
  }

  // Show empty state if no data
  if (!subjectLines) {
     return (
      <div className={sundayStyles.emptyStateContainer}>
        <SundayEmptyState />
        {onRetry && (
          <div className={sundayStyles.emptyStateActions}>
            <UpdaterButton
              isPrimary={false}
              onClick={onRetry}
              icon="mdi:refresh"
              label="Reload"
            />
          </div>
        )}
      </div>
    );
  }

  // Get all unique slugs from the first subject line set (option 0)
  const firstSet = subjectLines[0];
  const slugs = firstSet ? Object.keys(firstSet) : [];

  if (slugs.length === 0) {
     return (
      <div className={sundayStyles.emptyStateContainer}>
        <SundayEmptyState />
        {onRetry && (
          <div className={sundayStyles.emptyStateActions}>
            <UpdaterButton
              isPrimary={false}
              onClick={onRetry}
              icon="mdi:refresh"
              label="Reload"
            />
          </div>
        )}
      </div>
    );
  }

  const getRowStatus = (slug: string) => {
    if (updatingSlugs.has(slug)) return 'updating';
    const result = updateResults.find(r => r.slug === slug);
    if (result?.success) return 'success';
    if (result && !result.success) return 'error';
    return null;
  };

  const getNewsletterId = (slug: string): string | null => {
    const nsltData = newsletterIds[slug];
    return nsltData?.aId || nsltData?.bId || null;
  };

  return (
    <div className={sundayStyles.sundaySection}>
      <div className={sundayStyles.sundayTable}>
        <div className={sundayStyles.tableHeader}>
          <div className={sundayStyles.slugColumn}>Country</div>
          <div className={sundayStyles.newsletterIdHeader}>NSLT ID</div>
          {[0, 1, 2, 3, 4, 5].map(optionIndex => (
            <div
              key={optionIndex}
              className={clsx(sundayStyles.subjectLineColumn, {
                [sundayStyles.columnSelected]: selectedIndex === optionIndex,
              })}
            >
              <label className={sundayStyles.optionLabel} htmlFor={`subjectLineOption_${optionIndex}`}>
                <input
                  id={`subjectLineOption_${optionIndex}`}
                  type="radio"
                  name={`subjectLineOption_${optionIndex}`}
                  checked={selectedIndex === optionIndex}
                  onChange={() => onSelectOption(optionIndex)}
                />
                <span>SL {optionIndex + 1}</span>
              </label>
            </div>
          ))}
        </div>

        {slugs.map(slug => {
          const rowStatus = getRowStatus(slug);
          const rowClass = clsx(sundayStyles.tableRow, {
            [sundayStyles.rowUpdating]: rowStatus === 'updating',
            [sundayStyles.rowSuccess]: rowStatus === 'success',
            [sundayStyles.rowError]: rowStatus === 'error',
          });
          const result = updateResults.find(r => r.slug === slug);
          const errorMessage = result?.error;
          const flagUrl = getFlagUrl(slug);
          const nsltId = getNewsletterId(slug);

          return (
            <div key={slug} className={rowClass}>
              <div className={sundayStyles.slugColumn}>
                {flagUrl && <img src={flagUrl} alt={`${slug} flag`} className={sundayStyles.flagIcon} />}
                <span>{slug}</span>
                {rowStatus === 'updating' && (
                  <Icon icon="svg-spinners:180-ring" width="14" height="14" className={sundayStyles.spinner} />
                )}
                {rowStatus === 'success' && (
                  <Icon icon="mdi:check-circle" width="14" height="14" className={sundayStyles.successIcon} />
                )}
                {rowStatus === 'error' && (
                  <>
                    <Icon icon="mdi:alert-circle" width="14" height="14" className={sundayStyles.errorIcon} />
                    {errorMessage && (
                      <span className={sundayStyles.errorTooltip} title={errorMessage}>
                        <Icon icon="mdi:information" width="12" height="12" />
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className={sundayStyles.newsletterIdColumn}>
                {nsltId ? (
                  <a
                    href={`https://www.prologistics.info/news_email.php?id=${nsltId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={sundayStyles.idLink}
                  >
                    {nsltId}
                  </a>
                ) : (
                  <span className={sundayStyles.idText}>-</span>
                )}
              </div>
              {[0, 1, 2, 3, 4, 5].map(optionIndex => {
                const isSelected = selectedIndex === optionIndex;
                return (
                  <div
                    key={optionIndex}
                    className={clsx(sundayStyles.subjectLineColumn, {
                      [sundayStyles.columnSelected]: isSelected,
                    })}
                  >
                    {subjectLines[optionIndex]?.[slug] || '-'}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
