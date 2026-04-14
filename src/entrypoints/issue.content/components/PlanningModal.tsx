import { useState } from 'react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import { generateChecklist } from '../api/checklistGeneration';
import type { ChecklistMode } from '../lib/types';

type PlanningModalProps = {
  issueId: number;
  chdeId: string | null;

  mode?: ChecklistMode;
  onClose: () => void;
  onSuccess?: () => void;
};

const PlanningModal = ({ issueId, chdeId, mode, onClose, onSuccess }: PlanningModalProps) => {
  const [startIdNewsletter, setStartIdNewsletter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsletterTitle, setNewsletterTitle] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true)
    const fetchNewsletterTitle = async () => {
      try {
        const response = await fetch(`https://www.prologistics.info/api/issueLog/list/?page_id=${issueId}`);
        const data = await response.json();
        const title = data?.issue_list?.[0]?.issue;
        setNewsletterTitle(title || null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch newsletter title:', err);
        setNewsletterTitle(null);
        setLoading(false);
      }}

    fetchNewsletterTitle();
  }, [issueId]);

  // https://www.prologistics.info/api/issueLog/list/?page_id=466278

  const handlePlanning = async () => {
   
  };

  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
      <div className={clsx(formStyles.modal)} onClick={e => e.stopPropagation()}>
        <div className={formStyles.modalHeader}>
          <h2>Are you sure?</h2>
          <button className={formStyles.closeBtn} onClick={onClose}>
            <Icon icon="mdi:close" width="20" height="20" />
          </button>
        </div>

        <div className={formStyles.modalContent}>
          {error && <div className={clsx(formStyles.error, formStyles.formError)}>{error}</div>}

          <div className={formStyles.formGroup}>
            <span>Newsletter: {loading ? 'Loading...' : newsletterTitle?.split("SL")[0]}</span>
            <span>Subject Line: {loading ? 'Loading...' : newsletterTitle?.split("SL")[1]}</span>
            <span>CHDE ID: {chdeId}</span>
          </div>

          <div className={formStyles.modalButtons}>
            <button
              className={clsx(formStyles.btn, formStyles['btn--primary'])}
              onClick={() => handlePlanning()}
              disabled={loading}
            >
              <Icon icon="mdi:playlist-plus" width="14" height="14" className={loading ? formStyles.spinning : ''} />
              {loading ? 'Loading...' : 'Start Planning'}
            </button>
          </div>

          <button className={clsx(formStyles.btn, formStyles['btn--ghost'])} onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanningModal;
