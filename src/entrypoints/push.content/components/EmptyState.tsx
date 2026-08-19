import styles from '../push.module.scss';
import { EmptyStateProps } from '../types/push';



export const EmptyState = ({ isGenerating, isLoadingTranslations }: EmptyStateProps) => {
  let message = 'Select a campaign name and click "Generate All".';
  
  if (isGenerating) {
    message = 'Generating campaign...';
  } else if (isLoadingTranslations) {
    message = 'Loading translations...';
  }

  return (
    <div className={styles.emptyState}>
      {message}
    </div>
  );
};