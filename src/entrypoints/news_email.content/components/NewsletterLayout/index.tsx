import styles from './NewsletterLayout.module.scss';

import { BannerType } from '../../types';

import MobileBanner from './MobileBanner';

const NewsletterLayout = ({ banners }: { banners: BannerType[] }) => {
  return (
    <div className={styles.bannerList}>
      {banners.length === 0 ? (
        <p>No banners added yet</p>
      ) : (
        banners.map(banner => <MobileBanner key={banner.order} banner={banner} />)
      )}
    </div>
  );
};

export default NewsletterLayout;
