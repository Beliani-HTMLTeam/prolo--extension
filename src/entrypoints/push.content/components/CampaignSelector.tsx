import { generateImageUrl, generateLpPath, parseCampaignName } from "../helpers/slugMapper";
import styles from '../push.module.scss';

type CampaignSelectorProps = {
  campaignName: string;
  availableTabs: string[];
  isLoadingTabs?: boolean;
  isLoadingTranslations?: boolean;
  dateWarning?: string | null;
  onSetCampaignName: (name: string) => void;
};

export const CampaignSelector = ({
  campaignName,
  availableTabs,
  isLoadingTabs,
  isLoadingTranslations,
  dateWarning,
  onSetCampaignName,
}: CampaignSelectorProps) => {
  const parsedDate = campaignName ? parseCampaignName(campaignName) : null;

  return (
    <div className={styles.fieldGroup}>
      <label>Campaign Name:</label>
      {isLoadingTabs ? (
        <div className={styles.loadingIndicator}>Loading tabs...</div>
      ) : (
        <select
          value={campaignName}
          onChange={e => onSetCampaignName(e.target.value)}
          className={styles.select}
          disabled={availableTabs.length === 0}
        >
          <option value="">Select a campaign</option>
          {availableTabs.map(tab => (
            <option key={tab} value={tab}>
              {tab}
            </option>
          ))}
        </select>
      )}
      {dateWarning && <div className={styles.dateWarning}>{dateWarning}</div>}
      {campaignName && parsedDate && (
        <div className={styles.metaRowInfo}>
          <span>📅 Date: {parsedDate.date}</span>
          <span>🔢 Version: {parsedDate.version}</span>
          <span>🖼️ Image: {generateImageUrl(campaignName)}</span>
          <span>🔗 LP Path: {generateLpPath(campaignName)}</span>
          {!parsedDate.hasDate && <span>⚠️ No date in name</span>}
        </div>
      )}
      {isLoadingTranslations && <div className={styles.loadingIndicator}>Loading translations...</div>}
    </div>
  );
};