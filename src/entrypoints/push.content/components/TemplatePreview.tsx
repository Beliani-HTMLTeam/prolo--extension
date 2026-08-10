import styles from '../push.module.scss';

type TemplatePreviewProps = {
  campaign: { data: Record<string, any> } | null;
  chdeTemplateId: string;
};

export const TemplatePreview = ({ campaign, chdeTemplateId }: TemplatePreviewProps) => {
  if (!campaign || Object.keys(campaign.data).length === 0) {
    return null;
  }

  return (
    <div className={styles.templatePreviewBox}>
      <span className={styles.title}>Template IDs based on CHDE: {chdeTemplateId}</span>
      <div className={styles.badgeList}>
        {Object.entries(campaign.data).map(([slug, rowData]) => (
          <span key={slug} className={styles.templateBadge}>
            {slug.toUpperCase()}: {rowData["[name='template']"]}
          </span>
        ))}
      </div>
    </div>
  );
};