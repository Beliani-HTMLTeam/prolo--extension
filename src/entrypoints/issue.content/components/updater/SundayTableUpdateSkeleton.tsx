import Skeleton from "react-loading-skeleton";
import sundayStyles from '../../styles/sunday.module.scss';
import { getFlagUrl } from "@/entrypoints/newtab/utils/updater/flag";

interface SundayTableUpdateSkeletonProps {
  rowsCount: number;
  availableSlugs?: string[];
}

export const SundayTableUpdateSkeleton = ({ rowsCount, availableSlugs }: SundayTableUpdateSkeletonProps) => {
 const slugs = availableSlugs && availableSlugs?.length > 0 ? availableSlugs : Array(rowsCount).fill('LOADING');

  return (
    <div className={sundayStyles.sundaySection}>
      <div className={sundayStyles.sundayTable}>
        <div className={sundayStyles.tableHeader}>
          <div className={sundayStyles.slugColumn}>Country</div>
           <div className={sundayStyles.newsletterIdHeader}>
            <Skeleton width={40} height={16} />
          </div>
          {[0, 1, 2, 3, 4, 5].map(optionIndex => (
            <div key={optionIndex} className={sundayStyles.subjectLineColumn}>
              <Skeleton width={40} height={16} />
            </div>
          ))}
        </div>

        {slugs.map((slug, index) => {
          const flagUrl = getFlagUrl(slug);
          const isRealSlug = slug !== 'LOADING';
          
          return (
            <div key={`skeleton-${index}`} className={sundayStyles.tableRow}>
              <div className={sundayStyles.slugColumn}>
                {flagUrl && isRealSlug ? (
                  <img
                    src={flagUrl}
                    alt={`${slug} flag`}
                    className={sundayStyles.flagIcon}
                  />
                ) : (
                  <Skeleton circle width={18} height={18} />
                )}
                {isRealSlug ? (
                  <span>{slug}</span>
                ) : (
                  <Skeleton width={40} height={14} />
                )}
              </div>
              <div className={sundayStyles.newsletterIdColumn}>
                <Skeleton width={60} height={12} />
              </div>
              {[0, 1, 2, 3, 4, 5].map(optionIndex => (
                <div key={optionIndex} className={sundayStyles.subjectLineColumn}>
                  <Skeleton width="90%" height={14} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};