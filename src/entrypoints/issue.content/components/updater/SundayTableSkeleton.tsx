import Skeleton from 'react-loading-skeleton';
import sundayStyles from '../../styles/sunday.module.scss';
import { SundayTableSkeletonProps } from '@/entrypoints/issue.content/types/Updater';

export const SundayTableSkeleton = ({ rowsCount = 10 }: SundayTableSkeletonProps) => {
  const skeletonRows = Array(rowsCount).fill(null);
  const skeletonOptions = [0, 1, 2, 3, 4, 5];

  return (
    <div className={sundayStyles.sundaySection}>
      <div className={sundayStyles.sundayTable}>
        <div className={sundayStyles.tableHeader}>
          <div className={sundayStyles.slugColumn}>Country</div>
          {skeletonOptions.map(optionIndex => (
            <div key={optionIndex} className={sundayStyles.subjectLineColumn}>
              <label className={sundayStyles.optionLabel}>
                <input type="radio" name="sundayOption" disabled />
                <span>SL {optionIndex + 1}</span>
              </label>
            </div>
          ))}
        </div>

        {skeletonRows.map((_, rowIndex) => (
          <div key={`skeleton-${rowIndex}`} className={sundayStyles.tableRow}>
            <div className={sundayStyles.slugColumn}>
              <Skeleton width={60} />
            </div>
            {skeletonOptions.map(optionIndex => (
              <div key={optionIndex} className={sundayStyles.subjectLineColumn}>
                <Skeleton width="90%" height={20} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
