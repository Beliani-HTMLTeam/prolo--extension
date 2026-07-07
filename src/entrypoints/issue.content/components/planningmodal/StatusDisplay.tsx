import { StatusDisplayProps } from '@/entrypoints/issue.content/types/Planning';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import formStyles from '@/assets/styles/forms.module.scss';
import planningStyles from '../../styles/planning.module.scss';

const StatusLabel = ({ icon, text }: { icon: string; text: string }) => (
  <>
    <Icon icon={icon} />
    <span>{text}</span>
  </>
);

export const StatusDisplay = ({
  result,
  planningStarted,
  slug,
  ready,
  aggregating,
  loading,
  selectedSlugs,
  onResend,
}: StatusDisplayProps) => {
  if (!selectedSlugs.has(slug) && planningStarted) return null;

  if (!ready) {
    return <StatusLabel icon="material-symbols:error" text="Approval required" />;
  }

  if (loading && !aggregating) {
    // Check if this specific result has been processed
    if (!result || result.status === 'pending') {
      return <StatusLabel icon="fa:hourglass-start" text="Pending..." />;
    }
  }

  // If aggregating (fetching customer data)
  if (aggregating) {
    return <StatusLabel icon="svg-spinners:180-ring" text="" />;
  }

  if (result?.status === 'success') {
    return <StatusLabel icon="fluent-mdl2:completed-solid" text="Success" />;
  }

  if (result?.status === 'error' && result?.failed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#f44336' }}>
          <Icon icon="material-symbols:close-rounded" width="14" height="14" /> {result.error}
        </span>

        <button
          className={clsx(formStyles.btn, formStyles['btn--ghost'], planningStyles.btn)}
          onClick={() => onResend(slug, result.type)}
        >
          <Icon icon="mdi:refresh" width="12" height="12" />
          Resend
        </button>
      </div>
    );
  }

  if (ready && !planningStarted) {
    return <StatusLabel icon="material-symbols:local-fire-department" text="Ready" />;
  }

  return null;
};
