import styles from '../push.module.scss';
import { SLUG_ORDER } from '../helpers/slugMapper';

type SlugSelectorProps = {
  selectedSlugs: string[];
  campaign: { data: Record<string, any> } | null;
  onToggleSlug: (slug: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
};

export const SlugSelector = ({
  selectedSlugs,
  campaign,
  onToggleSlug,
  onSelectAll,
  onDeselectAll,
}: SlugSelectorProps) => {
  const getTemplateIdForSlug = (slug: string): string | null => {
    if (!campaign || !campaign.data[slug]) return null;
    return campaign.data[slug]["[name='template']"] || null;
  };

  return (
    <div className={styles.slugSection}>
      <div className={styles.slugToolbar}>
        <button onClick={onSelectAll} className={styles.btnSelect}>
          Select All
        </button>
        <button onClick={onDeselectAll} className={styles.btnSelect}>
          Deselect All
        </button>
        <span className={styles.selectedCount}>{selectedSlugs.length} selected</span>
      </div>
      <div className={styles.slugGrid}>
        {SLUG_ORDER.map(slug => {
          const templateId = getTemplateIdForSlug(slug);
          return (
            <label
              key={slug}
              className={`${styles.slugChip} ${selectedSlugs.includes(slug) ? styles.selected : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedSlugs.includes(slug)}
                onChange={() => onToggleSlug(slug)}
              />
              <span className={styles.slugName}>{slug}</span>
              {templateId && (
                <span className={styles.slugTemplateId}>→ {templateId}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};