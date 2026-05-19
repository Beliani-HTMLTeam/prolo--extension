import updaterStyles from '../../styles/updater.module.scss';

export const EmptyState = () => (
  <div className={updaterStyles.updaterTable}>
    <div className={updaterStyles.shopRow}>
      <div className={updaterStyles.shopSelector}>No translations found</div>
    </div>
  </div>
);
