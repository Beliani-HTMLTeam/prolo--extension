import { PlanningResult } from '@/entrypoints/newtab/types/Planning';
import formStyles from '../styles/forms.module.scss';

type ProgressSectionProps = {
  newsletterTitle: string | null;
  newsletterTitleLoading: boolean;
  chdeId: string | null;
  isABTesting?: boolean;
  progress: { current: number; total: number };
  results: PlanningResult[];
};

export const ProgressSection = ({
  newsletterTitle,
  newsletterTitleLoading,
  chdeId,
  isABTesting = false,
  progress,
  results,
}: ProgressSectionProps) => (
  <div className={formStyles.formGroup}>
    <div>
      <strong>Newsletter:</strong> {newsletterTitleLoading ? 'Loading...' : newsletterTitle?.split('SL')[0]}
    </div>
    <div>
      <strong>Subject Line:</strong> {newsletterTitleLoading ? 'Loading...' : newsletterTitle?.split('SL')[1]}
    </div>
    <div>
      <strong>CHDE ID:</strong> {chdeId}
    </div>
    {isABTesting && (
      <div>
        <strong>AB Test:</strong> Yes
      </div>
    )}
    {progress.current > 0 && (
      <div>
        <strong>Progress:</strong> {progress.current} / {progress.total} shops
        <div style={{ marginTop: '8px', height: '4px', background: '#e0e0e0', borderRadius: '2px' }}>
          <div
            style={{
              width: `${(progress.current / progress.total) * 100}%`,
              height: '100%',
              background: '#4caf50',
              borderRadius: '2px',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
    )}
    {progress.current > 0 &&
      results.slice(0, progress.current).map((r, index) => (
        <div key={`${r.slug}-${r.type}-${index}`} style={{ fontSize: '12px', marginTop: '4px' }}>
          {r.status === 'success' && `✅ ${r.slug}: ${r.customers} customers`}
          {r.status === 'error' && `❌ ${r.slug}: ${r.error}`}
          {r.status === 'pending' && `⏳ ${r.slug}: Pending...`}
        </div>
      ))}
  </div>
);
