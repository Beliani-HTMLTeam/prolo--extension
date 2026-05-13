import { UpdaterSelectedItem } from "@/entrypoints/newtab/types/Updater";
import { LineTitleTranslations } from "../../lib/types";
import planningStyles from '../../styles/updater.module.scss';

interface UpdaterTableProps {
  translations: LineTitleTranslations | null;
  loading?: boolean;
  onToggleSL?: (slug: string, checked: boolean, content: string) => void;
  onTogglePT?: (slug: string, checked: boolean, content: string) => void;
  selectedItems?: UpdaterSelectedItem[]
}

const UpdaterTable = ({translations,   loading, 
  onToggleSL, 
  onTogglePT,
  selectedItems = []}: UpdaterTableProps) => {
  if (loading) {
    return (
      <div className={planningStyles.planningTable}>
        <div className={planningStyles.shopRow}>
          <div className={planningStyles.shopSelector}>Loading...</div>
        </div>
      </div>
    )
  }

  if(!translations?.subjectLine || !translations?.pageTitle) {
  return (
    <div className={planningStyles.planningTable}>
      <div className={planningStyles.shopRow}>
        <div className={planningStyles.shopSelector}>No translations found</div>
      </div>
    </div>
  )
}

const allSlugs = new Set<string>();
if(translations?.subjectLine) {
  Object.keys(translations.subjectLine).forEach(slug => allSlugs.add(slug));
}

if (translations?.pageTitle) {
  Object.keys(translations.pageTitle).forEach(slug => allSlugs.add(slug));
}

const isSLSelected = (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'subjectLine');

const isPTSelected = (slug: string) => selectedItems.some(item => item.slug === slug && item.type === 'pageTitle');

const handleToggleSL = (slug: string, checked: boolean, content: string) => {
  onToggleSL?.(slug, checked, content);
}

const handleTogglePT = (slug: string, checked: boolean, content: string) => {  onTogglePT?.(slug, checked, content);
}

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
            onChange={(e) => {
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
            onChange={(e) => {
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
      </div>

      {Array.from(allSlugs).sort().map(slug => {
        const subjectLine = translations?.subjectLine?.[slug];
        const pageTitle = translations?.pageTitle?.[slug];
        const hasSL = !!subjectLine;
        const hasPT = !!pageTitle;

        return (
          <div key={slug} className={planningStyles.shopRow}>
            <div className={planningStyles.shopLabel}>
              {slug}
            </div>
            
            <div className={planningStyles.subjectLine}>
              <span>{subjectLine || '-'}</span>
              {hasSL && (
                <input
                  type="checkbox"
                  checked={isSLSelected(slug)}
                  onChange={(e) => handleToggleSL(slug, e.target.checked, subjectLine)}
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
                  onChange={(e) => handleTogglePT(slug, e.target.checked, pageTitle)}
                  disabled={loading}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default UpdaterTable;