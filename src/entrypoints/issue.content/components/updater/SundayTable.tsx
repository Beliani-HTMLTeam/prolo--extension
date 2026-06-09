import { SundayEmptyState } from './SundayEmptyState';
import { SundayTableSkeleton } from './SundayTableSkeleton';
import sundayStyles from '../../styles/sunday.module.scss';
import clsx from 'clsx';
import { Icon } from '@iconify/react';

interface SundayTableProps {
  subjectLines: Record<number, Record<string, string>> | null;
  selectedIndex: number | null;
  onSelectOption: (index: number) => void;
  loading: boolean;
  availableSlugs?: string[];
  updatingSlugs?: Set<string>;
  updateResults?: Array<{ slug: string; success: boolean; error?: string }>;
}

const SKELETON_ROWS_COUNT = 10;

export const SundayTable = ({
  subjectLines,
  selectedIndex,
  onSelectOption,
  loading,
  availableSlugs = [],
  updatingSlugs = new Set(),
  updateResults = [],
}: SundayTableProps) => {
  if (loading) {
    const rowsCount = availableSlugs.length > 0 ? availableSlugs.length : SKELETON_ROWS_COUNT;
    return <SundayTableSkeleton rowsCount={rowsCount} />;
  }

  // Show empty state if no data
  if (!subjectLines) {
    return <SundayEmptyState />;
  }

  // Get all unique slugs from the first subject line set (option 0)
  const firstSet = subjectLines[0];
  const slugs = firstSet ? Object.keys(firstSet) : [];

  if (slugs.length === 0) {
    return <SundayEmptyState />;
  }

  const getRowStatus = (slug: string) => {
    if (updatingSlugs.has(slug)) return 'updating';
    const result = updateResults.find(r => r.slug === slug);
    if (result?.success) return 'success';
    if (result && !result.success) return 'error';
    return null;
  };

  return (
    <div className={sundayStyles.sundaySection}>
      <div className={sundayStyles.sundayTable}>
        <div className={sundayStyles.tableHeader}>
          <div className={sundayStyles.slugColumn}>Country</div>
          {[0, 1, 2, 3, 4, 5].map(optionIndex => (
            <div key={optionIndex} className={sundayStyles.subjectLineColumn}>
              <label className={sundayStyles.optionLabel}>
                <input
                  type="radio"
                  name="sundayOption"
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

          return (
            <div key={slug} className={rowClass}>
              <div className={sundayStyles.slugColumn}>
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
              {[0, 1, 2, 3, 4, 5].map(optionIndex => (
                <div key={optionIndex} className={sundayStyles.subjectLineColumn}>
                  {subjectLines[optionIndex]?.[slug] || '-'}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
