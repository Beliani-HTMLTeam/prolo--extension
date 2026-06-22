import { useState, useEffect } from 'react';
import Modal from '@/components/modal/Modal';
import styles from './CustomBannerModal.module.scss';
import { normalizeBannerHref } from '../../utils/banner';

export type CustomBannerModalProps = {
  isOpen: boolean;
  initialSrcSuffix?: string;
  initialHref?: string;
  isCustomBanner?: boolean;
  onClose: () => void;
  onConfirm: (srcSuffix: string, href: string) => void;
};

const CustomBannerModal = ({
  isOpen,
  initialSrcSuffix = '',
  initialHref = '',
  isCustomBanner = true,
  onClose,
  onConfirm,
}: CustomBannerModalProps) => {
  const [srcSuffix, setSrcSuffix] = useState(initialSrcSuffix);
  const [href, setHref] = useState(initialHref);

  useEffect(() => {
    if (isOpen) {
      setSrcSuffix(initialSrcSuffix);
      setHref(initialHref);
    }
  }, [isOpen, initialSrcSuffix, initialHref]);

  const handleConfirm = () => {
    const trimmedSrcSuffix = srcSuffix.trim().replace(/^\/+/, '');
    const normalizedHref = normalizeBannerHref(href);

    if (isCustomBanner && !trimmedSrcSuffix) return;
    if (!normalizedHref) return;

    onConfirm(trimmedSrcSuffix, normalizedHref);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
  };

  const isConfirmDisabled = (isCustomBanner && !srcSuffix.trim()) || !href.trim();

  const title = initialSrcSuffix || initialHref ? 'Edit banner' : 'Add custom banner';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="420px">
      <div className={styles.body} onKeyDown={handleKeyDown}>
        {isCustomBanner && (
          <div className={styles.formGroup}>
            <label htmlFor="banner-src-suffix">Banner src suffix</label>
            <input
              id="banner-src-suffix"
              type="text"
              placeholder="header_01"
              value={srcSuffix}
              onChange={e => setSrcSuffix(e.target.value)}
              autoFocus
            />
            <span className={styles.hint}>Part after "uk" and before ".png" in the image URL</span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="banner-href">Banner href path</label>
          <input
            id="banner-href"
            type="text"
            placeholder="/content/lp"
            value={href}
            onChange={e => setHref(e.target.value)}
            autoFocus={!isCustomBanner}
          />
          <span className={styles.hint}>Path without domain, e.g. /content/lp</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={isConfirmDisabled}>
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomBannerModal;
