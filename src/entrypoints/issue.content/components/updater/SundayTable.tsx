import { SundayEmptyState } from './SundayEmptyState';
import { SundayTableSkeleton } from './SundayTableSkeleton';
import sundayStyles from '../../styles/sunday.module.scss';

interface SundayTableProps {
  subjectLines: Record<number, Record<string, string>> | null;
  selectedIndex: number | null;
  onSelectOption: (index: number) => void;
  loading: boolean;
  availableSlugs?: string[];
}

const SKELETON_ROWS_COUNT = 10;

export const SundayTable = ({
  subjectLines,
  selectedIndex,
  onSelectOption,
  loading,
  availableSlugs = [],
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

        {slugs.map(slug => (
          <div key={slug} className={sundayStyles.tableRow}>
            <div className={sundayStyles.slugColumn}>{slug}</div>
            {[0, 1, 2, 3, 4, 5].map(optionIndex => (
              <div key={optionIndex} className={sundayStyles.subjectLineColumn}>
                {subjectLines[optionIndex]?.[slug] || '-'}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
