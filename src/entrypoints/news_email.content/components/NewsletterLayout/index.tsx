import appStyles from '../../App.module.scss';
import styles from './NewsletterLayout.module.scss';

import { BannerType } from '../../types';
import TitVersionSelect from '../TitVersionSelect';

import MobileBanner from './MobileBanner';

type NewsletterLayoutProps = {
  banners: BannerType[];
  dragIndex: number | null;
  titVersion: number;
  onTitVersionChange: (version: number) => void;
  onRemoveBanner: (banner: BannerType) => void;
  onEditBannerRequest: (banner: BannerType) => void;
  onTimerRequest: (banner: BannerType) => void;
  onPreviewBannersRequest: (banner: BannerType) => void;
  onDragStart: (index: number) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
};

const NewsletterLayout = ({
  banners,
  dragIndex,
  titVersion,
  onTitVersionChange,
  onRemoveBanner,
  onEditBannerRequest,
  onTimerRequest,
  onPreviewBannersRequest,
  onDragStart,
  onDragOver,
  onDragEnd,
}: NewsletterLayoutProps) => {
  return (
    <>
      <div className={appStyles.panelHeader}>
        <div className={styles.headerTitleRow}>
          <h2>Newsletter layout</h2>
          <TitVersionSelect value={titVersion} onChange={onTitVersionChange} />
        </div>
        <p>Drag banners to reorder them. Remove unwanted items with the trash icon.</p>
      </div>

      {banners.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No banners added yet</p>
          <span>Pick a banner from the available list to start building the newsletter.</span>
        </div>
      ) : (
        <div className={styles.bannerList}>
          {banners.map((banner, index) => (
            <MobileBanner
              key={banner.order}
              banner={banner}
              isDragging={dragIndex === index}
              onRemove={onRemoveBanner}
              onEditBannerRequest={onEditBannerRequest}
              onTimerRequest={onTimerRequest}
              onPreviewBannersRequest={onPreviewBannersRequest}
              onDragStart={() => onDragStart(index)}
              onDragOver={event => onDragOver(event, index)}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default NewsletterLayout;
