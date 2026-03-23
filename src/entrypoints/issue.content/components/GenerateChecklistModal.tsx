import { useState } from 'react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import { generateChecklist } from '../api/checklistGeneration';

type GenerateChecklistModalProps = {
  issueId: number;
  onClose: () => void;
  onSuccess?: () => void;
};

const GenerateChecklistModal = ({ issueId, onClose, onSuccess }: GenerateChecklistModalProps) => {
  const [startIdNewsletter, setStartIdNewsletter] = useState('');
  const [startIdLp, setStartIdLp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (mode: 'newsletter' | 'lp') => {
    const startId = mode === 'newsletter' ? startIdNewsletter : startIdLp;

    if (!startId.trim()) {
      setError(`Please enter Start ID for ${mode}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await generateChecklist(issueId, { startId, mode });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(`Failed to generate ${mode} checklist: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Generate checklist error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
      <div className={clsx(formStyles.modal)} onClick={e => e.stopPropagation()}>
        <div className={formStyles.modalHeader}>
          <h2>Generate Checklist</h2>
          <button className={formStyles.closeBtn} onClick={onClose}>
            <Icon icon="mdi:close" width="20" height="20" />
          </button>
        </div>

        <div className={formStyles.modalContent}>
          {error && <div className={clsx(formStyles.error, formStyles.formError)}>{error}</div>}

          <div className={formStyles.formGroup}>
            <label htmlFor="startNewsletterInput">Start ID Newsletter</label>
            <input
              id="startNewsletterInput"
              type="text"
              className={formStyles.input}
              placeholder="CHDE Newsletter ID"
              value={startIdNewsletter}
              onChange={e => setStartIdNewsletter(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={formStyles.formGroup}>
            <label htmlFor="startLpInput">Start ID Landing</label>
            <input
              id="startLpInput"
              type="text"
              className={formStyles.input}
              placeholder="CH Shop Content ID"
              value={startIdLp}
              onChange={e => setStartIdLp(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={formStyles.modalButtons}>
            <button
              className={clsx(formStyles.btn, formStyles['btn--primary'])}
              onClick={() => handleGenerate('newsletter')}
              disabled={loading}
            >
              <Icon icon="mdi:playlist-plus" width="14" height="14" className={loading ? formStyles.spinning : ''} />
              {loading ? 'Generating...' : 'Generate Newsletter Checklist'}
            </button>

            <button
              className={clsx(formStyles.btn, formStyles['btn--primary'])}
              onClick={() => handleGenerate('lp')}
              disabled={loading}
            >
              <Icon icon="mdi:playlist-plus" width="14" height="14" className={loading ? formStyles.spinning : ''} />
              {loading ? 'Generating...' : 'Generate LP Checklist'}
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

export default GenerateChecklistModal;
