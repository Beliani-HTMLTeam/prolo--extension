import Skeleton from 'react-loading-skeleton';
import updaterStyles from '../../styles/updater.module.scss';
import { LPSectionProps } from '@/entrypoints/issue.content/types/Updater';


export const LPSection = ({
  loading,
  useGlobalLP,
  globalLP,
  onToggleGlobalLP,
  onGlobalLPChange,
  hasABLandingPages = false,
  globalLPB = '',
  onGlobalLPBChange,
}: LPSectionProps) => {
  if (loading) {
    return (
      <div className={updaterStyles.lpSection}>
        <div className={updaterStyles.lpHeader}>
          <Skeleton width="100%" height={20} />
        </div>
        <div className={updaterStyles.lpField}>
          <Skeleton width="100%" height={34} />
        </div>
      </div>
    );
  }

  return (
    <div className={updaterStyles.lpSection}>
      <div className={updaterStyles.lpHeader}>
        <label>
          <input type="checkbox" checked={useGlobalLP} onChange={e => onToggleGlobalLP(e.target.checked)} />
          Regular LP
        </label>
        {!useGlobalLP && <span className={updaterStyles.warningText}>(FD/MD mode enabled - per-shop LP IDs)</span>}
      </div>
      <div className={updaterStyles.lpField}>
        <label>{hasABLandingPages ? 'Landing Page A:' : 'Landing Page:'}</label>
        <input
          type="text"
          value={globalLP}
          onChange={e => onGlobalLPChange(e.target.value)}
          disabled={!useGlobalLP}
          className={!useGlobalLP ? updaterStyles.lpInputDisabled : ''}
          placeholder="lp26-04-05"
        />
      </div>
      {hasABLandingPages && (
        <div className={updaterStyles.lpField}>
          <label>Landing Page B:</label>
          <input
            type="text"
            value={globalLPB}
            onChange={e => onGlobalLPBChange?.(e.target.value)}
            disabled={!useGlobalLP}
            className={!useGlobalLP ? updaterStyles.lpInputDisabled : ''}
            placeholder="lp26-04-05"
          />
        </div>
      )}
    </div>
  );
};
 