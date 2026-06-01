import styles from './NewsletterLayout.module.scss';

import { Icon } from '@iconify/react';

import { BannerType } from '../../types';
import { Banner } from '../../utils/banner';

const MobileBanner = ({ banner }: { banner: BannerType }) => {
  const handleBannerRemove = () => {
    // Implement banner removal logic here
    console.log(`Remove banner with order: ${banner.order}`);
  };

  return (
    <div className={styles.bannerItem}>
      <span>
        {banner.date}
        <Icon icon="icon-park-outline:drag" />
      </span>

      <Banner date={banner.date} type="mobile" />

      <button onClick={handleBannerRemove}>
        <Icon icon="tabler:trash" />
      </button>
    </div>
  );
};

export default MobileBanner;
