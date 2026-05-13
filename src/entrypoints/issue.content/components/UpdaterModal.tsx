import { UpdaterProps, UpdaterSelectedItem } from '@/entrypoints/newtab/types/Updater';
import { fetchIssueData, fetchSubjectPageTranslations } from '../api/issueData';
import { useEffect, useState } from 'react';
import { LineTitleTranslations } from '../lib/types';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import planningStyles from '../styles/updater.module.scss';
import { ModalHeader } from './planningmodal/ModalHeader';
import UpdaterTable from './slptupdater/UpdaterTable';
import UpdaterButtons from './slptupdater/UpdaterButtons';

const UpdaterModal = ({ issueId, onClose }: UpdaterProps) => {
  const [translations, setTranslations] = useState<LineTitleTranslations | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<UpdaterSelectedItem[]>([]);

  useEffect(() => {
    const loadIssueData = async () => {
      setLoading(true);
      try {
        const issueData = await fetchIssueData(issueId);
        const issueItem = issueData.issue_list?.[0];
        if (!issueItem) {
          console.warn('No issue data found for issue ID:', issueId);
          setError('Issue data not found');
          return;
        }
        void fetchSubjectPageTranslations(issueItem).then(translations => {
          console.log("sl/pt: ", translations);
          
          setTranslations(translations);
        });
      } catch (e) {
        console.error('Failed to load SL/PT translations: ', e);
        setError('Failed to load translations');
      } finally {
        setLoading(false);
      }
    };

    void loadIssueData();
  }, [issueId]);

  const handleToggleSL = (slug: string, checked: boolean, content: string) => {
    if(checked) {
      setSelectedItems(prev => [...prev, { slug, type: 'subjectLine', content }]);
    } 
    else {
      setSelectedItems(prev => prev.filter(item => !(item.slug === slug && item.type === 'subjectLine')));
    }
  }

  const handleTogglePT = (slug: string, checked: boolean, content: string) => {
    if(checked) {
      setSelectedItems(prev => [...prev, { slug, type: 'pageTitle', content }]);
    } 
    else {
      setSelectedItems(prev => prev.filter(item => !(item.slug === slug && item.type === 'pageTitle')));
    }
  }

  const handleSelectedAllSL = () => {}

  const handleSelectedAllPT = () => {}

  const handleClearAll = () => {}

  const handleUpdateSelected = () => {}

  const handleUpdateAll = () => {}

 return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
      <div className={clsx(planningStyles.modal)} onClick={e => e.stopPropagation()}>
        <ModalHeader title="Updater" onClose={onClose} />
 <div className={planningStyles.modalContent}>
          <div className={planningStyles.menu}>
            <UpdaterButtons
              loading={loading}
              updateStarted={false}
              readyCount={0}
              selectedCount={0}
              hasManualSelection={false}
              onUpdateAllSL={() => {}}
              onUpdateSelectedSL={() => {}}
              onUpdateAllPT={() => {}}
              onUpdateSelectedPT={() => {}}
              onUpdateAll={() => {}}
              onUpdateSelected={() => {}}
              onSelectAll={() => {}}
              onClearAll={() => {}}
              onCancel={() => {}}
            />
          </div>
        <UpdaterTable translations={translations} loading={loading} />
          </div>
      </div>
    </div>
  );
};

export default UpdaterModal;
