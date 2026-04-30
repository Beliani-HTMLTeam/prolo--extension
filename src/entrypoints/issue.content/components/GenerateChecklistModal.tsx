import { useState } from 'react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { toast } from 'sonner';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import { generateChecklist } from '../api/checklistGeneration';
import type { ChecklistMode } from '../lib/types';

type GenerateChecklistModalProps = {
  issueId: number;
  mode?: ChecklistMode;
  onClose: () => void;
  onSuccess?: () => void;
};

const GenerateChecklistModal = ({ issueId, mode, onClose, onSuccess }: GenerateChecklistModalProps) => {
  const [startIdNewsletter, setStartIdNewsletter] = useState('');
  const [startIdLp, setStartIdLp] = useState('');
  const [loadingNslt, setLoadingNslt] = useState(false);
  const [loadingLp, setLoadingLp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLpGeneration = mode !== 'sunday';

  const handleGenerate = async (mode: 'newsletter' | 'lp') => {
    const startId = mode === 'newsletter' ? startIdNewsletter : startIdLp;

    if (!startId.trim()) {
      toast.error(`Please enter Start ID for ${mode}`);
      return;
    }

    mode === 'newsletter' ? setLoadingNslt(true) : setLoadingLp(true);

    try {
      await generateChecklist(issueId, { startId, mode });
      toast.success(`Successfully generated ${mode} checklist`);
      onSuccess?.();
    } catch (err) {
      toast.error(`Failed to generate ${mode} checklist: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Generate checklist error:', err);
    } finally {
      mode === 'newsletter' ? setLoadingNslt(false) : setLoadingLp(false);
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
          <div className={formStyles.formGroup}>
            <label htmlFor="startNewsletterInput">Start ID Newsletter</label>
            <input
              id="startNewsletterInput"
              type="text"
              className={formStyles.input}
              placeholder="CHDE Newsletter ID"
              value={startIdNewsletter}
              onChange={e => setStartIdNewsletter(e.target.value)}
              disabled={loadingNslt}
            />

            <button
              className={clsx(formStyles.btn, formStyles['btn--primary'])}
              onClick={() => handleGenerate('newsletter')}
              disabled={loadingNslt}
            >
              <Icon icon={loadingNslt ? 'svg-spinners:180-ring' : 'mdi:playlist-plus'} width="14" height="14" />
              {loadingNslt ? 'Generating newsletter checklist...' : 'Generate Newsletter Checklist'}
            </button>
          </div>

          {hasLpGeneration && (
            <div className={formStyles.formGroup}>
              <label htmlFor="startLpInput">Start ID Landing</label>
              <input
                id="startLpInput"
                type="text"
                className={formStyles.input}
                placeholder="CH Shop Content ID"
                value={startIdLp}
                onChange={e => setStartIdLp(e.target.value)}
                disabled={loadingLp}
              />

              <button
                className={clsx(formStyles.btn, formStyles['btn--primary'])}
                onClick={() => handleGenerate('lp')}
                disabled={loadingLp}
              >
                <Icon icon={loadingLp ? 'svg-spinners:180-ring' : 'mdi:playlist-plus'} width="14" height="14" />
                {loadingLp ? 'Generating LP checklist...' : 'Generate LP Checklist'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateChecklistModal;
