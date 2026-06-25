import { Icon } from '@iconify/react';
import styles from './PreviewBannersModal.module.scss';
import { BannerType } from '../../types';
import { Banner } from '../../utils/banner';
import ActionButton from '@/components/Button';

type PreviewBannersModalProps = {
  isOpen: boolean;
  banner: BannerType | null;
  onClose: () => void;
};

const SLUGS = [
  'uk',
  'pl',
  'de',
  'at',
  'chde',
  'nl',
  'fr',
  'chfr',
  'es',
  'pt',
  'it',
  'dk',
  'no',
  'fi',
  'se',
  'cz',
  'sk',
  'hu',
  'befr',
  'benl',
  'ro',
  'chit',
];

const PreviewBannersModal = ({ isOpen, banner, onClose }: PreviewBannersModalProps) => {
  if (!isOpen || !banner) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Preview all versions for {banner.isCustom ? 'custom banner' : banner.date}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <Icon icon="tabler:x" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.bannersGrid}>
            {SLUGS.map(slug => (
              <div key={slug} className={styles.slugGroup}>
                <h4>{slug.toUpperCase()}</h4>
                <div className={styles.bannerRow}>
                  <div className={styles.bannerContainer}>
                    <small>Desktop</small>
                    {banner.isCustom ? (
                      <img
                        src={`https://pictureserver.net/static/${new Date().getFullYear().toString()}/${slug}${banner.customSrcSuffix?.replace(/^\/+/, '')}.png`}
                        alt={`${slug} custom`}
                        loading="lazy"
                      />
                    ) : (
                      <Banner date={banner.date ?? ''} type="desktop" localeSlug={slug} />
                    )}
                  </div>
                  <div className={styles.bannerContainer}>
                    <small>Mobile</small>
                    {banner.isCustom ? (
                      <img
                        src={`https://pictureserver.net/static/${new Date().getFullYear().toString()}/${slug}${banner.customSrcSuffix?.replace(/^\/+/, '')}_mb.png`}
                        alt={`${slug} custom mb`}
                        loading="lazy"
                      />
                    ) : (
                      <Banner date={banner.date ?? ''} type="mobile" localeSlug={slug} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <ActionButton label="Close" onClick={onClose} variant="ghost" />
        </div>
      </div>
    </div>
  );
};

export default PreviewBannersModal;
