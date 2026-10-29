import headerStyles from '../styles/header.module.scss';
import ActionButton from '@/components/Button';
import { START_PLANNING_EVENT } from '../lib/dashboardEvents';
import { StatusChips } from './familytable/StatusChips';
import LinksDropdown from './LinkChips';
import ExtraFieldsMenu from './ExtraFieldsMenu';
import type { ChecklistTableData, IssueExtraField, IssueLink } from '../lib/types';

export const HeaderProgress = ({
  tableData,
  banners,
}: {
  tableData: ChecklistTableData | null;
  banners?: { done: number; total: number };
}) => {
  const hasChips = !!tableData && (tableData.allTranslationsDone !== undefined || (tableData.progressChips?.length ?? 0) > 0);
  const hasBanners = !!banners && banners.total > 0;
  if (!hasChips && !hasBanners) return null;

  return (
    <div className={headerStyles.headerCard}>
      <span className={headerStyles.headerCardLabel}>Progress</span>
      <div className={headerStyles.headerCardBody}>
        {tableData && <StatusChips data={tableData} banners={banners} />}
      </div>
    </div>
  );
};

type HeaderLinksProps = {
  issueLinks: IssueLink[];
  extraFields: IssueExtraField[];
  showExtraFields: boolean;
};

export const HeaderLinks = ({ issueLinks, extraFields, showExtraFields }: HeaderLinksProps) => {
  const hasExtraFields = showExtraFields && extraFields.length > 0;
  if (issueLinks.length === 0 && !hasExtraFields) return null;

  return (
    <div className={headerStyles.headerCard}>
      <span className={headerStyles.headerCardLabel}>Links</span>
      <div className={headerStyles.headerCardBody}>
        <LinksDropdown links={issueLinks} />
        {hasExtraFields && <ExtraFieldsMenu fields={extraFields} />}
      </div>
    </div>
  );
};

export const HeaderPlanningButton = () => (
  <ActionButton
    variant="primary"
    label="Start Planning"
    icon="mdi:calendar-start"
    onClick={() => document.dispatchEvent(new CustomEvent(START_PLANNING_EVENT))}
  />
);
