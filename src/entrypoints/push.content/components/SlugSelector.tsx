import { memo, useMemo } from 'react';
import styles from '../push.module.scss';
import { SLUG_ORDER } from '../helpers/slugMapper';
import { type SlugSelectorProps } from '../types/push';

export const SlugSelector = memo(
  ({ selectedSlugs, campaign, onToggleSlug, onSelectAll, onDeselectAll }: SlugSelectorProps) => {
    const selected = useMemo(() => new Set(selectedSlugs), [selectedSlugs]);
    const data = campaign?.data;

    return (
      <div className={styles.slugSection}>
        <div className={styles.slugToolbar}>
          <button type="button" onClick={onSelectAll} className={styles.btnSelect}>
            Select All
          </button>
          <button type="button" onClick={onDeselectAll} className={styles.btnSelect}>
            Deselect All
          </button>
          <span className={styles.selectedCount}>{selectedSlugs.length} selected</span>
        </div>
        <div className={styles.slugGrid}>
          {SLUG_ORDER.map(slug => {
            const isSelected = selected.has(slug);
            const templateId = data?.[slug]?.["[name='template']"] || null;
            return (
              <label key={slug} className={`${styles.slugChip} ${isSelected ? styles.selected : ''}`}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggleSlug(slug)} />
                <span className={styles.slugName}>{slug}</span>
                {templateId && <span className={styles.slugTemplateId}>→ {templateId}</span>}
              </label>
            );
          })}
        </div>
      </div>
    );
  },
);

SlugSelector.displayName = 'SlugSelector';
