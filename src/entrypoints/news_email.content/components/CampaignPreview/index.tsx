import { useMemo } from 'react';
import styles from './CampaignPreview.module.scss';
import newsletterTemplate from '../../template.html?raw';
import { BannerType } from '../../types';
import { buildNewsletterPreviewHtml } from '../../utils/banner';
import Modal from '@/components/modal/Modal';

type CampaignPreviewProps = {
  isOpen: boolean;
  banners: BannerType[];
  onClose: () => void;
};

const CampaignPreview = ({ isOpen, banners, onClose }: CampaignPreviewProps) => {
  const previewHtml = useMemo(() => buildNewsletterPreviewHtml(newsletterTemplate, banners), [banners]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rendered template:" width="80vw" height="90vh">
      <iframe className={styles.frame} title="Newsletter preview" srcDoc={previewHtml} />
    </Modal>
  );
};

export default CampaignPreview;
