import { useState, useEffect } from 'react';
import Modal from '@/components/modal/Modal';
import styles from './TimerBannerModal.module.scss';
import clsx from 'clsx';
import { TimerConfig } from '../../types';

/** Ordered list of shop slugs matching timer URL positions */
const SHOP_SLUGS = [
  'uk', 'pl', 'de', 'at', 'chde',
  'nl', 'fr', 'chfr', 'es', 'pt',
  'it', 'dk', 'no', 'fi', 'se',
  'cz', 'sk', 'hu', 'ro', 'benl', 'befr',
];

const TOTAL_SHOPS = SHOP_SLUGS.length;

export type TimerBannerModalProps = {
  isOpen: boolean;
  /** Pre-filled config when editing an existing timer */
  initialConfig?: TimerConfig;
  onClose: () => void;
  onConfirm: (config: TimerConfig) => void;
  /** Called when user removes an existing timer config */
  onRemove?: () => void;
};

const DEFAULT_BG = '#ff2f00';

const TimerBannerModal = ({ isOpen, initialConfig, onClose, onConfirm, onRemove }: TimerBannerModalProps) => {
  const [timerUrlsText, setTimerUrlsText] = useState('');
  const [freebieSrc, setFreebieSrc] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BG);
  const [bgText, setBgText] = useState(DEFAULT_BG);

  useEffect(() => {
    if (isOpen) {
      setTimerUrlsText(initialConfig?.timerUrls.join('\n') ?? '');
      setFreebieSrc(initialConfig?.freebieSrc ?? '');
      const bg = initialConfig?.backgroundColor ?? DEFAULT_BG;
      setBackgroundColor(bg);
      setBgText(bg);
    }
  }, [isOpen, initialConfig]);

  const parsedUrls = timerUrlsText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const urlCount = parsedUrls.length;
  const isConfirmDisabled = urlCount === 0;

  const handleBgTextChange = (value: string) => {
    setBgText(value);
    // Only sync to color picker if it looks like a valid hex
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setBackgroundColor(value);
    }
  };

  const handleColorPickerChange = (value: string) => {
    setBackgroundColor(value);
    setBgText(value);
  };

  const handleConfirm = () => {
    if (isConfirmDisabled) return;
    const resolvedBg = /^#[0-9a-fA-F]{3,8}$/.test(bgText) ? bgText : DEFAULT_BG;
    onConfirm({
      timerUrls: parsedUrls,
      freebieSrc: freebieSrc.trim() || undefined,
      backgroundColor: resolvedBg,
    });
  };

  const urlCountClass =
    urlCount === 0 ? undefined
      : urlCount === TOTAL_SHOPS ? styles.urlCountOk
        : styles.urlCountError;

  const title = initialConfig ? 'Edit timer' : 'Add timer';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="520px" maxHeight="90vh">
      <div className={styles.body}>

        {/* Timer URLs */}
        <div className={styles.formGroup}>
          <label htmlFor="timer-urls">Timer URLs (one per shop)</label>
          <textarea
            id="timer-urls"
            placeholder={`https://gen.sendtric.com/countdown/abc123\nhttps://gen.sendtric.com/countdown/def456\n...`}
            value={timerUrlsText}
            onChange={e => setTimerUrlsText(e.target.value)}
            autoFocus
          />
          <span className={clsx(styles.urlCount, urlCountClass)}>
            {urlCount === 0
              ? 'Paste timer URLs — one per line'
              : urlCount === TOTAL_SHOPS
                ? `✓ ${urlCount} URLs — all ${TOTAL_SHOPS} shops covered`
                : `${urlCount} / ${TOTAL_SHOPS} URLs (order: ${SHOP_SLUGS.slice(0, urlCount).join(', ')}${urlCount < TOTAL_SHOPS ? ', ...' : ''})`}
          </span>
          <span className={styles.hint}>
            Shop order: {SHOP_SLUGS.join(', ')}
          </span>
        </div>

        {/* Freebie src */}
        <div className={styles.formGroup}>
          <label htmlFor="freebie-src">Freebie src date (optional)</label>
          <input
            id="freebie-src"
            type="text"
            placeholder="20260626"
            value={freebieSrc}
            onChange={e => setFreebieSrc(e.target.value)}
          />
          <span className={styles.hint}>
            Campaign date like <strong>20260626</strong> → pictureserver.net/static/2026/20260626free.png
          </span>
        </div>

        {/* Background color */}
        <div className={styles.formGroup}>
          <label>Background color</label>
          <div className={styles.colorRow}>
            <input
              type="color"
              value={backgroundColor}
              onChange={e => handleColorPickerChange(e.target.value)}
              title="Pick background color"
            />
            <input
              type="text"
              value={bgText}
              onChange={e => handleBgTextChange(e.target.value)}
              placeholder="#ff2f00"
            />
          </div>
          <span className={styles.hint}>Background for the timer and freebie rows</span>
        </div>

        <div className={styles.actions}>
          {onRemove && (
            <button className={styles.removeBtn} onClick={onRemove}>
              Remove timer
            </button>
          )}
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={isConfirmDisabled}>
            {initialConfig ? 'Update timer' : 'Add timer'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TimerBannerModal;
