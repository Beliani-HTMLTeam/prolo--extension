import Skeleton from "react-loading-skeleton";
import updaterStyles from '../../styles/updater.module.scss';

interface TableRowSkeletonProps {
  useGlobalLP: boolean;
  useGlobalDates: boolean;
}

export const TableRowSkeleton = ({ useGlobalLP, useGlobalDates }: TableRowSkeletonProps) => (
  <div className={updaterStyles.shopRow}>
    <div className={updaterStyles.shopLabel}>
      <Skeleton circle width={16} height={20} />
      <Skeleton width={40} height={20} />
    </div>

    <div className={updaterStyles.newsletterId}>
      <Skeleton width="100%" height={20} />
    </div>

    <div className={updaterStyles.subjectLine}>
      <Skeleton width="100%" height={20} />
      <Skeleton width={20} height={20} />
    </div>

    <div className={updaterStyles.landingPageId}>
      <Skeleton width="100%" height={20} />
    </div>

    <div className={updaterStyles.pageTitle}>
      <Skeleton width="100%" height={20} />
      <Skeleton width={20} height={20} />
    </div>

    <div className={updaterStyles.fdMd}>
      <Skeleton width={40} height={20} />
      <Skeleton width={40} height={20} />
    </div>

    {!useGlobalLP && (
      <div className={updaterStyles.landingPage}>
        <Skeleton width="100%" height={30} />
      </div>
    )}

    {!useGlobalDates && (
      <>
        <div className={updaterStyles.activateDate}>
          <Skeleton width="100%" height={30} />
        </div>
        <div className={updaterStyles.deactivateDate}>
          <Skeleton width="100%" height={30} />
        </div>
      </>
    )}
  </div>
)