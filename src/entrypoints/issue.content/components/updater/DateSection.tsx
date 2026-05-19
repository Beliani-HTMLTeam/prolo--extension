import Skeleton from "react-loading-skeleton";
import updaterStyles from '../../styles/updater.module.scss';
import { DatePicker } from "react-datepicker";

interface DateSectionProps {
  loading: boolean;
  useGlobalDate: boolean;
  globalDateConfig: { activateDate: Date; deactivateDate: Date };
  onToggleGlobalDate: (checked: boolean) => void;
  onActivateDateChange: (date: Date | null) => void;
  onDeactivateDateChange: (date: Date | null) => void;
}

export const DateSection = ({
  loading,
  useGlobalDate,
  globalDateConfig,
  onToggleGlobalDate,
  onActivateDateChange,
  onDeactivateDateChange,
}: DateSectionProps) => {
  if (loading) {
    return (
      <div className={updaterStyles.dateSection}>
        <div className={updaterStyles.dateHeader}>
          <Skeleton width="100%" height={20} />
        </div>
        <div className={updaterStyles.dateFields}>
          <div className={updaterStyles.dateField}>
            <Skeleton width="100%" height={34} count={2} style={{ marginBottom: '5px' }} />
          </div>
          <div className={updaterStyles.dateField}>
            <Skeleton width="100%" height={34} count={2} style={{ marginBottom: '5px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={updaterStyles.dateSection}>
      <div className={updaterStyles.dateHeader}>
        <label>
          <input type="checkbox" checked={useGlobalDate} onChange={e => onToggleGlobalDate(e.target.checked)} />
          Regular dates
        </label>
      </div>
      <div className={updaterStyles.dateFields}>
        <div className={updaterStyles.dateField}>
          <label>Activate Date (00:00):</label>
          <DatePicker
            selected={globalDateConfig.activateDate}
            onChange={onActivateDateChange}
            dateFormat="yyyy-MM-dd"
            minDate={new Date()}
            disabled={true}
            placeholderText="Select activate date"
            wrapperClassName={updaterStyles.datePickerWrapper}
          />
        </div>
        <div className={updaterStyles.dateField}>
          <label>Deactivate Date (23:59, Sunday):</label>
          <DatePicker
            selected={globalDateConfig.deactivateDate}
            onChange={onDeactivateDateChange}
            dateFormat="yyyy-MM-dd"
            minDate={new Date()}
            disabled={!useGlobalDate}
            placeholderText="Select deactivate date"
            wrapperClassName={updaterStyles.datePickerWrapper}
          />
        </div>
      </div>
    </div>
  );
}