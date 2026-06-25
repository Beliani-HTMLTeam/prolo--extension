import Modal from '@/components/modal/Modal';
import styles from './GenerateNewslettersModal.module.scss';
import clsx from 'clsx';

import { UpdateResult } from '../../utils/api';

type NewsletterMapping = {
  slug: string;
  id: string;
};

export type GenerateNewslettersModalProps = {
  isOpen: boolean;
  newsId: number;
  isUpdating: boolean;
  completed: number;
  total: number;
  selectedSlugs?: string[];
  results: UpdateResult[];
  mappedNewsletters: NewsletterMapping[];
  currentNewsletterSlug: string | null;
  onClose: () => void;
  onReset?: () => void;
  onConfirm: () => void;
};

const GenerateNewslettersModal = ({
  isOpen,
  newsId,
  isUpdating,
  completed,
  total,
  selectedSlugs = [],
  results,
  mappedNewsletters,
  currentNewsletterSlug,
  onClose,
  onReset,
  onConfirm,
}: GenerateNewslettersModalProps) => {
  const isRunning = isUpdating || total > 0;
  const isFinished = total > 0 && completed === total && !isUpdating;

  const resultMap = new Map(results.map(r => [r.slug, r]));
  const displaySlugs = isRunning ? (selectedSlugs.length > 0 ? selectedSlugs : results.map(r => r.slug)) : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={isUpdating ? () => {} : onClose}
      title="Generate newsletters"
      height="auto"
      width="560px"
    >
      {isRunning ? (
        <div className={styles.progressSection}>
          <h3 className={styles.progressTitle}>
            {isFinished ? `Finished (${completed} / ${total})` : `Updating newsletters... (${completed} / ${total})`}
          </h3>
          {currentNewsletterSlug && !isFinished && (
            <p className={styles.progressHint}>
              Current newsletter {currentNewsletterSlug.toUpperCase()} is updated last.
            </p>
          )}
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
        <div className={styles.content}>
          <div className={styles.message}>
            <p>Are you sure you want to update all newsletters?</p>
            <div className={styles.badgeRow}>
              <span className={styles.idBadge}>CH id: {isNaN(newsId) ? '—' : newsId}</span>
              {currentNewsletterSlug && (
                <span className={styles.idBadge}>Current newsletter: {currentNewsletterSlug.toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className={styles.mappingSection}>
            <div className={styles.mappingHeader}>
              <h4>Mapped newsletters</h4>
              <span>{mappedNewsletters.length} items</span>
            </div>

            <div className={styles.mappingList}>
              {mappedNewsletters.map(({ slug, id }) => (
                <div key={slug} className={styles.mappingRow}>
                  <span className={styles.mappingSlug}>{slug.toUpperCase()}</span>
                  <a
                    className={styles.mappingIdLink}
                    href={`${window.origin}/news_email.php?id=${id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {id}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={isUpdating}>
              Cancel
            </button>
            <button className={styles.confirmBtn} onClick={onConfirm} disabled={isUpdating}>
              Yes, generate
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default GenerateNewslettersModal;
