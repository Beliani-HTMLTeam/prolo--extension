import { PlanningProgressProps } from '@/entrypoints/newtab/types/Planning';
import PlanningStyles from '../../styles/planning.module.scss';

export const PlanningProgress = ({ loading, aggregating, progress }: PlanningProgressProps) => (
  <>
    {loading && (
      <div className={PlanningStyles.planningProgress}>
        <div
          style={{
            width: `${(progress.current / progress.total) * 100}%`,
            height: '4px',
            background: '#4caf50',
            borderRadius: '2px',
            transition: 'width 0.3s',
          }}
        />
        <div className={PlanningStyles.progressText}>
          {aggregating
            ? `Fetching customer data...`
            : `Sending newsletters... ${progress.current} / ${progress.total} newsletters`}
        </div>
      </div>
    )}
  </>
);
