import Skeleton from 'react-loading-skeleton';
import updaterStyles from '../../styles/updater.module.scss';

export const MenuSkeleton = () => (
  <div className={updaterStyles.skeletonButtons}>
    <Skeleton height={28} count={10} style={{ marginBottom: '8px' }} />
  </div>
);
