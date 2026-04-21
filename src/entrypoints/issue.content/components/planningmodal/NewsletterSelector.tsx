import clsx from 'clsx';
import formStyles from '../../styles/forms.module.scss';
import { ChecklistMode, ChecklistTableData } from '../../lib/types';
import { isSlugReadyForPlanning } from '@/entrypoints/newtab/utils/planning/isSlugReadyForPlanning';
import { Icon } from '@iconify/react';


type NewsletterSelectorProps = {
  availableSlugs: string[];
  mode: ChecklistMode | undefined;
  selectedSlugs: Set<string>;
  useAllSlugs: boolean;
  isABTesting: boolean;
  tableData: ChecklistTableData | null;
  onUseAllChange: (value: boolean) => void;
  onToggleSlug: (slug: string) => void;
  onAddSlug: (slug: string) => void; 
  onRemoveSlug: (slug: string) => void;
  onClearAll: () => void;
};

export const NewsletterSelector = ({
  availableSlugs,
  selectedSlugs,
  useAllSlugs,
  isABTesting,
  tableData,
  onUseAllChange,
  onToggleSlug,
  onAddSlug,
  onRemoveSlug,
  onClearAll,
  mode
}: NewsletterSelectorProps) => {
  const allSlugsReady = availableSlugs.every(slug => isSlugReadyForPlanning(tableData, slug, isABTesting, mode));
  const readySlugs = availableSlugs.filter(slug => isSlugReadyForPlanning(tableData, slug, isABTesting, mode));

  const handleSelectAllReady = () => {
   readySlugs.forEach(slug => {
    if (!selectedSlugs.has(slug)) {
      onAddSlug(slug);
    }
   })
  }

  const handleToggleSlug = (slug: string) => {
    if (!isSlugReadyForPlanning(tableData, slug, isABTesting, mode)) return
    
    if (selectedSlugs.has(slug)) {
      onRemoveSlug(slug);
    } else {
      onAddSlug(slug);
    }
  }

  return (
    <div className={formStyles.formGroup} style={{marginTop: '16px'}}>
      <div style={{marginBottom: '8px'}}>
        <strong>Newsletter Selection: </strong>
      </div>

      <div style={{marginBottom: '8px'
      }}>
        <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: allSlugsReady ? 'pointer' : 'not-allowed', opacity: allSlugsReady ? 1 : 0.5
        }}>
          <input
          type='radio'
          checked={useAllSlugs}
          onChange={() => allSlugsReady && onUseAllChange(true)}
          disabled={!allSlugsReady}
          />
          All Newsletters {!allSlugsReady && `(Only ${readySlugs.length} ready)`}
        </label>
        {mode ==='newsletter' && ( <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px'
        }}>
          <input
          type='radio'
          checked={!useAllSlugs}
          onChange={() => onUseAllChange(false)}
          />
          Select specific newsletters
        </label>)}
       
      </div>

      {!useAllSlugs && (
        <div style={{marginTop: '12px'}}>
          <div style={{marginBottom: '8px', display: 'flex', gap: '12px'}}>
            <button type='button' onClick={handleSelectAllReady} className={clsx(formStyles.btn, formStyles['btn--ghost'])} style={{padding: '4px 8px', fontSize: '12px'}} disabled={readySlugs.length === 0 }>
              Select All ({readySlugs.length})
            </button>
            <button type='button' onClick={onClearAll} className={clsx(formStyles.btn, formStyles['btn--ghost'])} style={{padding: '4px 8px', fontSize: '12px'}}>
              Clear All
            </button>
          </div>

          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {availableSlugs.map(slug => {
              const isReady = isSlugReadyForPlanning(tableData, slug, isABTesting, mode)
              const isSelected = selectedSlugs.has(slug)
              return (
              <label key={slug} 
              style={{
                display: 'flex',
                alignContent: 'center',
                gap: '4px',
                cursor: isReady ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                padding: '4px 6px',
                borderRadius: '4px',
                backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                opacity: isReady ? 1 : 0.5
              }}
              title={!isReady ? 'Missing required approvals (NSLT or LP)' : ''}
              >
                <input type="checkbox" checked={isSelected} onChange={() => handleToggleSlug(slug)} disabled={!isReady} />
                {slug}
                {!isReady && <Icon icon="mdi:alert-circle" width="14" height="14" style={{ color: '#ff9800' }} />}
              </label>
            )})}
          </div>
          <div style={{marginTop: '8px', fontSize: '12px', color:'#666'}}>
            Selected: {selectedSlugs.size} / {availableSlugs.length} newsletters
            {readySlugs.length < availableSlugs.length && (
              <span style={{color: '#ff9800', marginLeft: '8px'}}>
                ({availableSlugs.length - readySlugs.length} require approval)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
};
