import { StatusDisplayProps } from "@/entrypoints/newtab/types/Planning";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import formStyles from "../../styles/forms.module.scss";
import planningStyles from "../../styles/planning.module.scss";

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
    return (
      <span>
        <Icon icon="material-symbols:error" width="14" height="14" /> Requires approval
      </span>
    );
  }
  
   if (loading && !aggregating) {
    // Check if this specific result has been processed
    if (!result || result.status === 'pending') {
      return (
        <span>
          <Icon icon="fa:hourglass-start" width="14" height="14" /> Sending...
        </span>
      );
    }
  }

  // If aggregating (fetching customer data)
  if (aggregating) {
    return (
      <span>
        <Icon icon="material-symbols:info" width="14" height="14" /> Fetching customer data...
      </span>
    );
  }
  
  if (result?.status === 'success') {
    return (
      <span>
        <Icon icon="fluent-mdl2:completed-solid" width="14" height="14" /> Ready
      </span>
    );
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
    return (
      <span>
        <Icon icon="material-symbols:local-fire-department" width="14" height="14" /> Ready to plan
      </span>
    );
  }

  return null;
}