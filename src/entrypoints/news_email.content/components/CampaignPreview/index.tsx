import { useMemo } from 'react';
import styles from './CampaignPreview.module.scss';
import newsletterTemplate from '../../template.html?raw';
import { BannerType } from '../../types';
import { buildNewsletterPreviewHtml } from '../../utils/banner';
import Modal from '@/components/modal/Modal';

type CampaignPreviewProps = {
  isOpen: boolean;
  banners: BannerType[];
  translations: any;
  onClose: () => void;
};

const CampaignPreview = ({ isOpen, banners, translations, onClose }: CampaignPreviewProps) => {
  const previewHtml = useMemo(() => buildNewsletterPreviewHtml(newsletterTemplate, banners, 0, undefined, translations), [banners, translations]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rendered template:" width="80vw" height="90vh">
      <iframe className={styles.frame} title="Newsletter preview" srcDoc={previewHtml} />
    </Modal>
  );
};

export default CampaignPreview;
