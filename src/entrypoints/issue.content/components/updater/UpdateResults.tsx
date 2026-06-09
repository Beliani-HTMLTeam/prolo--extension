import { UpdateResult } from "@/entrypoints/newtab/types/Updater"
import { Icon } from "@iconify/react";
import updaterStyles from '../../styles/updater.module.scss';

interface UpdateResultsProps {
  results: UpdateResult[]
  onClose: () => void;
  onRetry?: () => void;
}

export const UpdateResults = ({results, onClose, onRetry}: UpdateResultsProps) => {
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  return (
    <div className={updaterStyles.resultsInline}>
        <div className={updaterStyles.resultsInlineHeader}>
          <div className={updaterStyles.resultsInlineSummary}>
            <Icon 
              icon={failureCount === 0 ? 'mdi:check-circle' : 'mdi:alert-circle'} 
              width="20" 
              height="20" 
              className={failureCount === 0 ? updaterStyles.successIcon : updaterStyles.errorIcon} 
            />
            <span>
              Update complete: {successCount} successful, {failureCount} failed
            </span>
          </div>
          <div className={updaterStyles.resultsInlineActions}>
            {failureCount > 0 && onRetry && (
              <button className={updaterStyles.retryButtonInline} onClick={onRetry}>
                <Icon icon="mdi:refresh" width="16" height="16" />
                Retry Failed
              </button>
            )}
            <button className={updaterStyles.closeButtonInline} onClick={onClose}>
              Close
            </button>
          </div>
        </div>   </div>
  );
 }
