import { buildBannerUrl, buildBannerHref } from '../../utils/banner';
import { BannerType } from '../../types';

import styles from './AvailableBanners.module.scss';
import ActionButton from '@/components/Button';

type AvailableBannersProps = {
  banners: BannerType[];
  selectedDates: Set<string>;
  onAddBanner: (banner: BannerType) => void;
  onPreviewBannersRequest: (banner: BannerType) => void;
};

const AvailableBanners = ({ banners, selectedDates, onAddBanner, onPreviewBannersRequest }: AvailableBannersProps) => {
  if (banners.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No banners match this search</p>
        <span>Try another date pattern like 25.05, 05.25 or just 25.</span>
      </div>
    );
  }

  return (
    <div className={styles.availableBanners}>
      {banners.map(banner => {
        const isAdded = banner.date ? selectedDates.has(banner.date) : false;

        return (
          <div
            key={banner.id}
            className={styles.bannerItem}
            style={{
              backgroundImage: `url(${buildBannerUrl(banner.date ?? '', 'desktop')}), url("https://placehold.co/610x181")`,
            }}
          >
            <a
              href={buildBannerHref(banner)}
              target="_blank"
              rel="noreferrer"
              className={styles.bannerDate}
              onClick={e => e.stopPropagation()}
            >
              {banner.date}
            </a>

            <div style={{ display: 'flex', gap: '8px' }}>
              <ActionButton
                icon="tabler:eye"
                label="Preview Banners"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  onPreviewBannersRequest(banner);
                }}
                aria-label="Preview banners"
                additionalClasses={styles.previewButton}
              />
              <ActionButton
                label={isAdded ? 'Added' : 'Add Banner'}
                disabled={isAdded}
                variant="primary"
                onClick={() => onAddBanner(banner)}
                additionalClasses={styles.bannerButton}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AvailableBanners;
