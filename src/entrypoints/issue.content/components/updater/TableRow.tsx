import DatePicker from "react-datepicker";
import updaterStyles from '../../styles/updater.module.scss';
import { formatDateForInput } from "@/entrypoints/newtab/utils/updater/dates";

interface TableRowProps {
  slug: string;
  subjectLine: string;
  pageTitle: string;
  hasSL: boolean;
  hasPT: boolean;
  activateDate: Date;
  deactivateDate: Date;
  lp: string;
  fdMode: boolean;
  mdMode: boolean;
  isSLSelected: boolean;
  isPTSelected: boolean;
  loading: boolean;
  useGlobalLP: boolean;
  useGlobalDates: boolean;
  onToggleCountry: (checked: boolean) => void;
  onToggleSL: (checked: boolean) => void;
  onTogglePT: (checked: boolean) => void;
  onFDModeChange: (checked: boolean) => void;
  onMDModeChange: (checked: boolean) => void;
  onLPChange: (value: string) => void;
  onActivateDateChange: (date: Date | null) => void;
  onDeactivateDateChange: (date: Date | null) => void;
}

export const TableRow = ({
  slug,
  subjectLine,
  pageTitle,
  hasSL,
  hasPT,
  activateDate,
  deactivateDate,
  lp,
  fdMode,
  mdMode,
  isSLSelected,
  isPTSelected,
  loading,
  useGlobalLP,
  useGlobalDates,
  onToggleCountry,
  onToggleSL,
  onTogglePT,
  onFDModeChange,
  onMDModeChange,
  onLPChange,
  onActivateDateChange,
  onDeactivateDateChange,
}: TableRowProps) => (
  <div className={updaterStyles.shopRow}>
    {/* Country Column */}
    <div className={updaterStyles.shopLabel}>
      <input type="checkbox" checked={isSLSelected || isPTSelected} onChange={e => onToggleCountry(e.target.checked)} disabled={loading} />
      <span>{slug}</span>
    </div>

    {/* Subject Line Column */}
    <div className={updaterStyles.subjectLine}>
      <span>{subjectLine || '-'}</span>
      {hasSL && (
        <input
          type="checkbox"
          checked={isSLSelected}
          onChange={e => onToggleSL(e.target.checked)}
          disabled={loading}
          title="Select subject line for update"
        />
      )}
    </div>

    {/* Page Title Column */}
    <div className={updaterStyles.pageTitle}>
      <span>{pageTitle || '-'}</span>
      {hasPT && (
        <input
          type="checkbox"
          checked={isPTSelected}
          onChange={e => onTogglePT(e.target.checked)}
          disabled={loading}
          title="Select page title for update"
        />
      )}
    </div>

    {/* FD/MD Column */}
    <div className={updaterStyles.fdMd}>
      <label className={`${updaterStyles.checkboxLabel} ${mdMode ? updaterStyles.disabled : ''}`}>
        <input type="checkbox" checked={fdMode} onChange={e => onFDModeChange(e.target.checked)} disabled={loading || mdMode} />
        <span>FD</span>
      </label>
      <label className={`${updaterStyles.checkboxLabel} ${fdMode ? updaterStyles.disabled : ''}`}>
        <input type="checkbox" checked={mdMode} onChange={e => onMDModeChange(e.target.checked)} disabled={loading || fdMode} />
        <span>MD</span>
      </label>
    </div>

    {/* Landing Page Column (conditional) */}
    {!useGlobalLP && (
      <div className={updaterStyles.landingPage}>
        <input type="text" value={lp || ''} onChange={e => onLPChange(e.target.value)} disabled={loading} placeholder="lp26-04-05" className={updaterStyles.lpInput} />
      </div>
    )}

    {/* Date Columns (conditional) */}
    {!useGlobalDates && (
      <>
        <div className={updaterStyles.activateDate}>
          <DatePicker
            selected={activateDate}
            onChange={onActivateDateChange}
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
            onChange={onDeactivateDateChange}
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