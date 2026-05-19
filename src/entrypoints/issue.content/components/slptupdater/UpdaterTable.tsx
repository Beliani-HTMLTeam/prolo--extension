import { UpdaterSelectedItem, UpdaterSlugDateConfig, UpdaterSlugLPConfig } from '@/entrypoints/newtab/types/Updater';
import { IssueListItem, LineTitleTranslations } from '../../lib/types';
import updaterStyles from '../../styles/updater.module.scss';
import { formatDateForInput } from '@/entrypoints/newtab/utils/updater/dates';
import DatePicker from 'react-datepicker';
import Skeleton from 'react-loading-skeleton';

interface UpdaterTableProps {
  translations: LineTitleTranslations | null;
  loading?: boolean;
  onToggleSL?: (slug: string, checked: boolean, content: string) => void;
  onTogglePT?: (slug: string, checked: boolean, content: string) => void;
  selectedItems?: UpdaterSelectedItem[];
  useGlobalDates?: boolean;
  onSlugActivateDateChange?: (slug: string, date: Date | null) => void;
  onSlugDeactivateDateChange?: (slug: string, date: Date | null) => void;
  getDateForSlug?: (slug: string, type: 'activate' | 'deactivate') => Date;
  getLPForSlug?: (slug: string) => string;
  onSlugLPChange?: (slug: string, lp: string) => void;
  useGlobalLP?: boolean;
  slugFMDModes?: Record<string, { fd: boolean; md: boolean }>;
  onSlugFMDModeChange?: (slug: string, mode: 'fd' | 'md', checked: boolean) => void;
  availableSlugs?: string[];
}

const SKELETON_ROWS_COUNT = 10;

const UpdaterTable = ({
  translations,
  loading,
  onToggleSL,
  onTogglePT,
  selectedItems = [],
  useGlobalDates = true,
  onSlugActivateDateChange,
  onSlugDeactivateDateChange,
  getDateForSlug,
  getLPForSlug,
  onSlugLPChange,
  useGlobalLP = true,
  slugFMDModes = {},
  onSlugFMDModeChange,
  availableSlugs = [],
}: UpdaterTableProps) => {
if (loading) {
    const skeletonSlugs = availableSlugs.length > 0 ? availableSlugs : Array(SKELETON_ROWS_COUNT).fill('loading');
    
    return (
      <div className={updaterStyles.updaterTable}>
        <div className={updaterStyles.tableHeader}>
          <div className={updaterStyles.shopLabel}>Country</div>
          <div className={updaterStyles.subjectLineHeader}>
            <span>Subject Line</span>
            <span className={updaterStyles.selectLabel}>Select all SL</span>
          </div>
          <div className={updaterStyles.pageTitleHeader}>
            <span>Page Title</span>
            <span className={updaterStyles.selectLabel}>Select all PT</span>
          </div>
          <div className={updaterStyles.fdMdHeader}>FD / MD</div>
          {!useGlobalLP && <div className={updaterStyles.landingPageHeader}>Landing Page</div>}
          {!useGlobalDates && (
            <>
              <div className={updaterStyles.activateDateHeader}>Activate Date</div>
              <div className={updaterStyles.deactivateDateHeader}>Deactivate Date</div>
            </>
          )}
        </div>

        {skeletonSlugs.map((slug, index) => (
          <div key={`skeleton-${index}`} className={updaterStyles.shopRow}>
            <div className={updaterStyles.shopLabel}>
              <Skeleton circle width={16} height={16} />
              <Skeleton width={60} />
            </div>

            <div className={updaterStyles.subjectLine}>
              <Skeleton width="100%" height={20} />
              <Skeleton width={20} height={20} />
            </div>

            <div className={updaterStyles.pageTitle}>
              <Skeleton width="100%" height={20} />
              <Skeleton width={20} height={20} />
            </div>

            <div className={updaterStyles.fdMd}>
              <Skeleton width={40} height={20} />
              <Skeleton width={40} height={20} />
            </div>

            {!useGlobalLP && (
              <div className={updaterStyles.landingPage}>
                <Skeleton width="100%" height={30} />
              </div>
            )}

            {!useGlobalDates && (
              <>
                <div className={updaterStyles.activateDate}>
                  <Skeleton width="100%" height={30} />
                </div>
                <div className={updaterStyles.deactivateDate}>
                  <Skeleton width="100%" height={30} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (!translations?.subjectLine || !translations?.pageTitle) {
    return (
      <div className={updaterStyles.updaterTable}>
        <div className={updaterStyles.shopRow}>
          <div className={updaterStyles.shopSelector}>No translations found</div>
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
    <div className={updaterStyles.updaterTable}>
      <div className={updaterStyles.tableHeader}>
        <div className={updaterStyles.shopLabel}>Country</div>
        <div className={updaterStyles.subjectLineHeader}>
          <span>Subject Line</span>
                  <span className={updaterStyles.selectLabel}>Select all SL</span>
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
        <div className={updaterStyles.pageTitleHeader}>
          <span>Page Title</span>
           <span className={updaterStyles.selectLabel}>Select all PT</span>
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
        <div className={updaterStyles.fdMdHeader}>FD / MD</div>
        {!useGlobalLP && <div className={updaterStyles.landingPageHeader}>Landing Page</div>}
        {!useGlobalDates && (
          <>
            <div className={updaterStyles.activateDateHeader}>Activate Date</div>
            <div className={updaterStyles.deactivateDateHeader}>Deactivate Date</div>
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
            <div key={slug} className={updaterStyles.shopRow}>
              <div className={updaterStyles.shopLabel}>
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

              <div className={updaterStyles.subjectLine}>
                <span>{subjectLine || '-'}</span>
                {hasSL && (
                  <input
                    type="checkbox"
                    checked={isSLSelected(slug)}
                    onChange={e => handleToggleSL(slug, e.target.checked, subjectLine)}
                    disabled={loading}
                    title='Select subject line for update'
                  />
                )}
              </div>

              <div className={updaterStyles.pageTitle}>
                <span>{pageTitle || '-'}</span>
                {hasPT && (
                  <input
                    type="checkbox"
                    checked={isPTSelected(slug)}
                    onChange={e => handleTogglePT(slug, e.target.checked, pageTitle)}
                    disabled={loading}
                     title="Select page title for update"
                  />
                )}
              </div>

              <div className={updaterStyles.fdMd}>
                <label className={`${updaterStyles.checkboxLabel} ${mdMode ? updaterStyles.disabled : ''}`}>
                  <input
                    type="checkbox"
                    checked={fdMode}
                    onChange={e => handleFMDModeChange(slug, 'fd', e.target.checked)}
                    disabled={loading || mdMode}
                  />
                  <span>FD</span>
                </label>
                <label className={`${updaterStyles.checkboxLabel} ${fdMode ? updaterStyles.disabled : ''}`}>
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
                <div className={updaterStyles.landingPage}>
                  <input
                    type="text"
                    value={lp}
                    onChange={e => onSlugLPChange?.(slug, e.target.value)}
                    disabled={loading}
                    placeholder="lp26-04-05"
                    className={updaterStyles.lpInput}
                  />
                </div>
              )}
              {!useGlobalDates && (
                <>
                  <div className={updaterStyles.activateDate}>
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
                  <div className={updaterStyles.deactivateDate}>
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
