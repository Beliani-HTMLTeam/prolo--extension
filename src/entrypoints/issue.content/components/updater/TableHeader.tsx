import updaterStyles from '../../styles/updater.module.scss';

interface TableHeaderProps {
  useGlobalLP: boolean;
  useGlobalDates: boolean;
  allSLSlugsLength: number;
  allPTSlugsLength: number;
  allSLSelected: boolean;
  allPTSelected: boolean;
  onSelectAllSL: (checked: boolean) => void;
  onSelectAllPT: (checked: boolean) => void;
}

export const TableHeader = ({
  useGlobalLP,
  useGlobalDates,
  allSLSlugsLength,
  allPTSlugsLength,
  allSLSelected,
  allPTSelected,
  onSelectAllSL,
  onSelectAllPT,
}: TableHeaderProps) => (
  <div className={updaterStyles.tableHeader}>
    <div className={updaterStyles.shopLabel}>Country</div>

    <div className={updaterStyles.newsletterIdHeader}>
      <span>NSLT ID</span>
    </div>

    <div className={updaterStyles.subjectLineHeader}>
      <span>Subject Line</span>
      <span className={updaterStyles.selectLabel}>Select all SL</span>
      <input
        type="checkbox"
        onChange={e => onSelectAllSL(e.target.checked)}
        checked={allSLSelected}
        disabled={allSLSlugsLength === 0}
      />
    </div>
    
    <div className={updaterStyles.landingPageIdHeader}>
      <span>LP ID</span>
    </div>

    <div className={updaterStyles.pageTitleHeader}>
      <span>Page Title</span>
      <span className={updaterStyles.selectLabel}>Select all PT</span>
      <input
        type="checkbox"
        onChange={e => onSelectAllPT(e.target.checked)}
        checked={allPTSelected}
        disabled={allPTSlugsLength === 0}
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
);
