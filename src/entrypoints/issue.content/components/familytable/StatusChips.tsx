import clsx from 'clsx';
import styles from '../../styles/FamilyTable.module.scss';
import type { ChecklistTableData } from '../../lib/types';

type StatusChipsProps = {
  data: ChecklistTableData;
  banners?: { done: number; total: number };
};

export const StatusChips = ({ data, banners }: StatusChipsProps) => {
  const progressChips = data.progressChips ?? [];
  const hasBanners = !!banners && banners.total > 0;

  if (data.allTranslationsDone === undefined && progressChips.length === 0 && !hasBanners) {
    return null;
  }

  return (
    <div className={styles.statusChips}>
      {data.allTranslationsDone !== undefined && (
        <span
          className={clsx(styles.statusChip, data.allTranslationsDone ? styles.chipReady : styles.chipMissing)}
          title={data.allTranslationsDone ? 'Translations: all ready' : 'Translations: missing'}
        >
          Lang
        </span>
      )}
      {progressChips.map(chip => {
        const done = chip.total - chip.missing.length;
        const percentDone = chip.total > 0 ? Math.round((done / chip.total) * 100) : 0;
        const isReady = chip.missing.length === 0;
        return (
          <span
            key={chip.key}
            className={clsx(styles.statusChip, isReady ? styles.chipReady : styles.chipMissing)}
            title={isReady ? `${chip.label}: all done` : `${chip.label} missing: ${chip.missing.join(', ')} (${percentDone}% done)`}
          >
            {chip.label}
            {!isReady && ` ${done}/${chip.total}`}
          </span>
        );
      })}
      {hasBanners && (
        <span
          className={clsx(styles.statusChip, banners.done === banners.total ? styles.chipReady : styles.chipMissing)}
          title={`Campaign banners: ${banners.done} of ${banners.total} approved`}
        >
          Banners{banners.done !== banners.total && ` ${banners.done}/${banners.total}`}
        </span>
      )}
    </div>
  );
};
