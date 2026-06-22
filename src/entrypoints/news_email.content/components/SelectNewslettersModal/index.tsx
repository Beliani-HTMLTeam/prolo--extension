import { useState, useEffect } from 'react';
import Modal from '@/components/modal/Modal';
import styles from './SelectNewslettersModal.module.scss';
import clsx from 'clsx';
import { UpdateResult } from '../../utils/api';

type Newsletter = {
  slug: string;
  name: string;
};

const AVAILABLE_NEWSLETTERS: Newsletter[] = [
  { slug: 'uk', name: 'United Kingdom' },
  { slug: 'pl', name: 'Polska' },
  { slug: 'de', name: 'Deutschland' },
  { slug: 'at', name: 'Österreich (DE)' },
  { slug: 'chde', name: 'Schweiz (DE)' },
  { slug: 'nl', name: 'Netherlands' },
  { slug: 'fr', name: 'France' },
  { slug: 'chfr', name: 'Suisse (FR)' },
  { slug: 'es', name: 'España' },
  { slug: 'pt', name: 'Portugal' },
  { slug: 'it', name: 'Italia' },
  { slug: 'dk', name: 'Danmark' },
  { slug: 'no', name: 'Norge' },
  { slug: 'fi', name: 'Suomi' },
  { slug: 'se', name: 'Sverige' },
  { slug: 'cz', name: 'Česká republika' },
  { slug: 'sk', name: 'Slovensko' },
  { slug: 'hu', name: 'Hungary' },
  { slug: 'ro', name: 'România' },
  { slug: 'benl', name: 'België (NL)' },
  { slug: 'befr', name: 'Belgique (FR)' },
];

export type SelectNewslettersModalProps = {
  isOpen: boolean;
  initialSelected?: string[];
  isUpdating?: boolean;
  completed?: number;
  total?: number;
  selectedSlugs?: string[];
  results?: UpdateResult[];
  onClose: () => void;
  onReset?: () => void;
  onConfirm: (selected: string[]) => void;
};

const SelectNewslettersModal = ({
  isOpen,
  initialSelected = [],
  isUpdating = false,
  completed = 0,
  total = 0,
  selectedSlugs = [],
  results = [],
  onClose,
  onReset,
  onConfirm,
}: SelectNewslettersModalProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  useEffect(() => {
    if (isOpen && total === 0) {
      setSelected(new Set(initialSelected));
    }
  }, [isOpen]);

  const toggle = (slug: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(AVAILABLE_NEWSLETTERS.map(n => n.slug)));
  const clearAll = () => setSelected(new Set());

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  const isRunning = isUpdating || total > 0;
  const isFinished = total > 0 && completed === total && !isUpdating;

  const displaySlugs = isRunning ? (selectedSlugs.length > 0 ? selectedSlugs : results.map(r => r.slug)) : [];

  const resultMap = new Map(results.map(r => [r.slug, r]));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isUpdating ? () => {} : onClose}
      title="Select newsletters to update"
      width="560px"
      height="auto"
    >
      {isRunning ? (
        <div className={styles.progressSection}>
          <h3 className={styles.progressTitle}>
            {isFinished ? `Finished (${completed} / ${total})` : `Updating newsletters... (${completed} / ${total})`}
          </h3>
          <div className={styles.progressList}>
            {displaySlugs.map((slug, i) => {
              const res = resultMap.get(slug);
              const status = res?.status ?? 'pending';
              return (
                <div key={`${slug}-${i}`} className={clsx(styles.resultItem, res && styles[res.status])}>
                  <span className={styles.slug}>{slug.toUpperCase()}</span>
                  {status === 'success' ? (
                    <span className={styles.statusSuccess}>Success</span>
                  ) : status === 'skipping' ? (
                    <span className={styles.statusSkipping}>Skipping</span>
                  ) : status === 'error' ? (
                    <span className={styles.statusError} title={res?.error}>
                      Error
                    </span>
                  ) : (
                    <span className={styles.statusPending}>Queued</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className={styles.actions}>
            {isFinished && onReset && (
              <button className={styles.cancelBtn} onClick={onReset}>
                Reset
              </button>
            )}
            <button className={styles.confirmBtn} onClick={onClose} disabled={isUpdating}>
              {isFinished ? 'Close' : 'Running…'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.toolbar}>
            <button onClick={selectAll} disabled={isUpdating}>
              Select all
            </button>
            <button onClick={clearAll} disabled={isUpdating}>
              Clear all
            </button>
          </div>

          <div className={styles.list}>
            {AVAILABLE_NEWSLETTERS.map(newsletter => {
              const isSelected = selected.has(newsletter.slug);
              return (
                <div
                  key={newsletter.slug}
                  className={clsx(styles.item, isSelected && styles.selected, isUpdating && styles.disabled)}
                  onClick={() => !isUpdating && toggle(newsletter.slug)}
                >
                  <input
                    type="checkbox"
                    id={`newsletter-${newsletter.slug}`}
                    checked={isSelected}
                    onChange={() => toggle(newsletter.slug)}
                    onClick={e => e.stopPropagation()}
                    disabled={isUpdating}
                  />
                  <div className={styles.label}>
                    <span className={styles.slug}>{newsletter.slug.toUpperCase()}</span>
                    <span className={styles.name}>{newsletter.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.footer}>
            <span className={styles.count}>
              {selected.size} of {AVAILABLE_NEWSLETTERS.length} selected
            </span>
            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose} disabled={isUpdating}>
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={selected.size === 0 || isUpdating}
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default SelectNewslettersModal;
