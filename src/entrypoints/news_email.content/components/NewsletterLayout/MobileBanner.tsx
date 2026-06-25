import styles from './NewsletterLayout.module.scss';

import { Icon } from '@iconify/react';

import { BannerType } from '../../types';
import { Banner, buildCustomBannerImageSrc, buildBannerHref } from '../../utils/banner';

type MobileBannerProps = {
  banner: BannerType;
  isDragging: boolean;
  onRemove: (banner: BannerType) => void;
  onEditBannerRequest: (banner: BannerType) => void;
  onTimerRequest: (banner: BannerType) => void;
  onPreviewBannersRequest: (banner: BannerType) => void;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
};

const MobileBanner = ({
  banner,
  isDragging,
  onRemove,
  onEditBannerRequest,
  onTimerRequest,
  onPreviewBannersRequest,
  onDragStart,
  onDragOver,
  onDragEnd,
}: MobileBannerProps) => {
  return (
    <div
      className={`${styles.bannerItem} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={event => {
        event.preventDefault();
        onDragOver(event);
      }}
      onDragEnd={onDragEnd}
    >
      <div className={styles.bannerInfo}>
        <strong>#{banner.order}</strong>

        <span className={styles.dragHandle}>
          <Icon icon="icon-park-outline:drag" />
        </span>

        <a
          href={buildBannerHref(banner)}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <small>{banner.isCustom ? 'custom' : banner.date}</small>
        </a>
      </div>

      <div className={styles.bannerPreview}>
        {banner.isCustom ? (
          <Banner
            src={buildCustomBannerImageSrc(banner.customSrcSuffix ?? '')}
            type="mobile"
            alt="Custom banner preview"
          />
        ) : (
          <Banner date={banner.date ?? ''} type="mobile" />
        )}
      </div>

      <div className={styles.bannerActions}>
        <button
          className={`${styles.actionBtn} ${banner.timerConfig ? styles.actionBtnActive : ''}`}
          onClick={() => onTimerRequest(banner)}
          aria-label={`${banner.timerConfig ? 'Edit' : 'Add'} timer for ${banner.isCustom ? 'custom banner' : banner.date}`}
          title={banner.timerConfig ? 'Edit timer' : 'Add timer'}
        >
          <Icon icon="tabler:clock" />
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => onEditBannerRequest(banner)}
          aria-label={`Edit banner url ${banner.isCustom ? 'custom banner' : banner.date}`}
        >
          <Icon icon="tabler:pencil" />
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => onPreviewBannersRequest(banner)}
          aria-label={`Preview banners for ${banner.isCustom ? 'custom banner' : banner.date}`}
          title="Preview banners"
        >
          <Icon icon="tabler:eye" />
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => onRemove(banner)}
          aria-label={`Remove banner ${banner.isCustom ? 'custom banner' : banner.date}`}
        >
          <Icon icon="tabler:trash" />
        </button>
      </div>
    </div>
  );
};

export default MobileBanner;
