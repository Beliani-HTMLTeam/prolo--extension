import styles from '../push.module.scss';
import { isValidTemplateId } from '../helpers/slugMapper';

type ChdeTemplateInputProps = {
  chdeTemplateId: string;
  isGenerating?: boolean;
  isLoadingTranslations?: boolean;
  campaignName?: string;
  onSetChdeTemplateId: (id: string) => void;
  onGenerateAll: () => void;
};

export const ChdeTemplateInput = ({
  chdeTemplateId,
  isGenerating,
  isLoadingTranslations,
  campaignName,
  onSetChdeTemplateId,
  onGenerateAll,
}: ChdeTemplateInputProps) => {
  return (
    <div className={styles.chdeRow}>
      <span className={styles.chdeLabel}>CHDE Template ID:</span>
      <input
        type="text"
        value={chdeTemplateId}
        onChange={e => onSetChdeTemplateId(e.target.value)}
        placeholder="Enter CHDE template ID"
        className={styles.input}
      />
      <button
        onClick={onGenerateAll}
        disabled={
          !campaignName ||
          !campaignName.trim() ||
          !isValidTemplateId(chdeTemplateId) ||
          isGenerating ||
          isLoadingTranslations
        }
        className={styles.btnGenerate}
      >
        {isGenerating ? 'Generating...' : isLoadingTranslations ? 'Loading...' : 'Generate All'}
      </button>
    </div>
  );
};