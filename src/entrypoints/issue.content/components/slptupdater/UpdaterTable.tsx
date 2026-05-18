import { UpdaterSelectedItem, UpdaterSlugDateConfig, UpdaterSlugLPConfig } from '@/entrypoints/newtab/types/Updater';
import { IssueListItem, LineTitleTranslations } from '../../lib/types';
import planningStyles from '../../styles/updater.module.scss';
import { formatDateForInput } from '@/entrypoints/newtab/utils/updater/dates';
import DatePicker from 'react-datepicker';

interface UpdaterTableProps {
  translations: LineTitleTranslations | null;
  loading?: boolean;
  onToggleSL?: (slug: string, checked: boolean, content: string) => void;
  onTogglePT?: (slug: string, checked: boolean, content: string) => void;
  selectedItems?: UpdaterSelectedItem[];
  useGlobalDates?: boolean;
  slugDateConfig?: UpdaterSlugDateConfig;
  onSlugActivateDateChange?: (slug: string, date: Date | null) => void;
  onSlugDeactivateDateChange?: (slug: string, date: Date | null) => void;
  getDateForSlug?: (slug: string, type: 'activate' | 'deactivate') => Date;
  slugLPConfig?: UpdaterSlugLPConfig;
  getLPForSlug?: (slug: string) => string;
  onSlugLPChange?: (slug: string, lp: string) => void;
  useGlobalLP?: boolean;
  slugFMDModes?: Record<string, { fd: boolean; md: boolean }>;
  onSlugFMDModeChange?: (slug: string, mode: 'fd' | 'md', checked: boolean) => void;
}

const UpdaterTable = ({
  translations,
  loading,
  onToggleSL,
  onTogglePT,
  selectedItems = [],
  useGlobalDates = true,
  slugDateConfig = {},
  onSlugActivateDateChange,
  onSlugDeactivateDateChange,
  getDateForSlug,
  slugLPConfig = {},
  getLPForSlug,
  onSlugLPChange,
  useGlobalLP = true,
  slugFMDModes = {},
  onSlugFMDModeChange,
}: UpdaterTableProps) => {
  if (loading) {
    return (
      <div className={planningStyles.planningTable}>
        <div className={planningStyles.shopRow}>
          <div className={planningStyles.shopSelector}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!translations?.subjectLine || !translations?.pageTitle) {
    return (
      <div className={planningStyles.planningTable}>
        <div className={planningStyles.shopRow}>
          <div className={planningStyles.shopSelector}>No translations found</div>
        </div>
      </div>
    );
  }

  const allSlugs = new Set<string>();
  if (translations?.subjectLine) {
    Object.keys(translations.subjectLine).forEach(slug => allSlugs.add(slug));
  }

  if (translations?.pageTitle) {
    Object.keys(translations.pageTitle).forEach(slug => allSlugs.add(slug));
  }

  const isSLSelected = (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'subjectLine');

  const isPTSelected = (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'pageTitle');

  const handleToggleSL = (slug: string, checked: boolean, content: string) => {
    onToggleSL?.(slug, checked, content);
  };

  const handleTogglePT = (slug: string, checked: boolean, content: string) => {
    onTogglePT?.(slug, checked, content);
  };

  const handleFMDModeChange = (slug: string, type: 'fd' | 'md', checked: boolean) => {
    onSlugFMDModeChange?.(slug, type, checked);
  

    if (onSlugLPChange) {
      const currentLP = getLPForSlug?.(slug) || '';
      const baseLP = currentLP.replace(/fd$|md$/, '');

      if (checked && type === 'fd') {
        onSlugLPChange(slug, `${baseLP}fd`);
      } else if (checked && type === 'md') {
        onSlugLPChange(slug, `${baseLP}md`);
      } else if (!checked && type === 'fd' && slugFMDModes[slug]?.md) {
        onSlugLPChange(slug, `${baseLP}md`);
      } else if (!checked && type === 'md' && slugFMDModes[slug]?.fd) {
        onSlugLPChange(slug, `${baseLP}fd`);
      } else if (!checked && !slugFMDModes[slug]?.fd && !slugFMDModes[slug]?.md) {
      onSlugLPChange(slug, baseLP);
    }
    }
  };

  const allSLSlugs = translations?.subjectLine ? Object.keys(translations.subjectLine) : [];
  const allPTSlugs = translations?.pageTitle ? Object.keys(translations.pageTitle) : [];
  const allSLSelected = allSLSlugs.length > 0 && allSLSlugs.every(slug => isSLSelected(slug));
  const allPTSelected = allPTSlugs.length > 0 && allPTSlugs.every(slug => isPTSelected(slug));

  return (
    <div className={planningStyles.planningTable}>
      <div className={planningStyles.tableHeader}>
        <div className={planningStyles.shopLabel}>Country</div>
        <div className={planningStyles.subjectLineHeader}>
          <span>Subject Line</span>
          <input
            type="checkbox"
            onChange={e => {
              const checked = e.target.checked;
              allSLSlugs.forEach(slug => {
                const content = translations?.subjectLine?.[slug];
                if (content) {
                  handleToggleSL(slug, checked, content);
                }
              });
            }}
            checked={allSLSelected}
            disabled={allSLSlugs.length === 0}
          />
        </div>
        <div className={planningStyles.pageTitleHeader}>
          <span>Page Title</span>
          <input
            type="checkbox"
            onChange={e => {
              const checked = e.target.checked;
              allPTSlugs.forEach(slug => {
                const content = translations?.pageTitle?.[slug];
                if (content) {
                  handleTogglePT(slug, checked, content);
                }
              });
            }}
            checked={allPTSelected}
            disabled={allPTSlugs.length === 0}
          />
        </div>
        <div className={planningStyles.fdMdHeader}>FD / MD</div>
        {!useGlobalLP && <div className={planningStyles.landingPageHeader}>Landing Page</div>}
        {!useGlobalDates && (
          <>
            <div className={planningStyles.activateDateHeader}>Activate Date</div>
            <div className={planningStyles.deactivateDateHeader}>Deactivate Date</div>
          </>
        )}
      </div>

      {Array.from(allSlugs)
        .sort()
        .map(slug => {
          const subjectLine = translations?.subjectLine?.[slug];
          const pageTitle = translations?.pageTitle?.[slug];
          const hasSL = !!subjectLine;
          const hasPT = !!pageTitle;
          const activateDate = getDateForSlug?.(slug, 'activate');
          const deactivateDate = getDateForSlug?.(slug, 'deactivate');
          const lp = getLPForSlug?.(slug) || '';
          const fdMode = slugFMDModes[slug]?.fd || false;
          const mdMode = slugFMDModes[slug]?.md || false;

          return (
            <div key={slug} className={planningStyles.shopRow}>
              <div className={planningStyles.shopLabel}>
                <input
                  type="checkbox"
                  checked={isSLSelected(slug) || isPTSelected(slug)}
                  onChange={e => {
                    const checked = e.target.checked;
                    if (checked) {
                      if (hasSL && subjectLine) {
                        handleToggleSL(slug, true, subjectLine);
                      }
                      if (hasPT && pageTitle) {
                        handleTogglePT(slug, true, pageTitle);
                      }
                    } else {
                      if (hasSL && subjectLine) {
                        handleToggleSL(slug, false, subjectLine);
                      }
                      if (hasPT && pageTitle) {
                        handleTogglePT(slug, false, pageTitle);
                      }
                    }
                  }}
                  disabled={loading}
                />
                <span>{slug}</span>
              </div>

              <div className={planningStyles.subjectLine}>
                <span>{subjectLine || '-'}</span>
                {hasSL && (
                  <input
                    type="checkbox"
                    checked={isSLSelected(slug)}
                    onChange={e => handleToggleSL(slug, e.target.checked, subjectLine)}
                    disabled={loading}
                  />
                )}
              </div>

              <div className={planningStyles.pageTitle}>
                <span>{pageTitle || '-'}</span>
                {hasPT && (
                  <input
                    type="checkbox"
                    checked={isPTSelected(slug)}
                    onChange={e => handleTogglePT(slug, e.target.checked, pageTitle)}
                    disabled={loading}
                  />
                )}
              </div>

              <div className={planningStyles.fdMd}>
                <label className={`${planningStyles.checkboxLabel} ${mdMode ? planningStyles.disabled : ''}`}>
                  <input
                    type="checkbox"
                    checked={fdMode}
                    onChange={e => handleFMDModeChange(slug, 'fd', e.target.checked)}
                    disabled={loading || mdMode}
                  />
                  <span>FD</span>
                </label>
                <label className={`${planningStyles.checkboxLabel} ${fdMode ? planningStyles.disabled : ''}`}>
                  <input
                    type="checkbox"
                    checked={mdMode}
                    onChange={e => handleFMDModeChange(slug, 'md', e.target.checked)}
                    disabled={loading || fdMode}
                  />
                  <span>MD</span>
                </label>
              </div>

              {!useGlobalLP && (
                <div className={planningStyles.landingPage}>
                  <input
                    type="text"
                    value={lp}
                    onChange={e => onSlugLPChange?.(slug, e.target.value)}
                    disabled={loading}
                    placeholder="lp26-04-05"
                    className={planningStyles.lpInput}
                  />
                </div>
              )}
              {!useGlobalDates && (
                <>
                  <div className={planningStyles.activateDate}>
                    <DatePicker
                      selected={activateDate}
                      onChange={(date: Date | null) => onSlugActivateDateChange?.(slug, date)}
                      dateFormat="yyyy-MM-dd"
                      disabled={true}
                      minDate={new Date()}
                      value={activateDate ? formatDateForInput(activateDate) : ''}
                      placeholderText="Select activate date"
                    />
                  </div>
                  <div className={planningStyles.deactivateDate}>
                    <DatePicker
                      selected={deactivateDate}
                      onChange={(date: Date | null) => onSlugDeactivateDateChange?.(slug, date)}
                      dateFormat="yyyy-MM-dd"
                      disabled={loading}
                      minDate={new Date()}
                      placeholderText="Select deactivate date"
                    />
                  </div>
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};
export default UpdaterTable;
