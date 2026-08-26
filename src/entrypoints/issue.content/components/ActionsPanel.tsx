import { Icon } from '@iconify/react';
import { useState, useCallback } from 'react';
import styles from '../styles/layout.module.scss';
import chatStyles from '../styles/chat.module.scss';
import { CommentsView } from './CommentsView';
import GenerateChecklistModal from './GenerateChecklistModal';
import type { ChecklistMode, ChecklistTableData, IssueLink } from '../lib/types';
import { getShopId } from './familytable/../../lib/shopIdMap';
import { LP_SHOPS_ORDER, SHOP_DOMAIN_MAP } from '../lib/shopConfig';
import PlanningModal from './PlanningModal';
import UpdaterModal from './UpdaterModal';
import { useTableDataIds } from '@/entrypoints/issue.content/utils/updater/hooks/useTableDataIds';
import ActionButton from '@/components/Button';

const LINK_ICON_MAP: [string, string][] = [
  ['figma', 'simple-icons:figma'],
  ['spreadsheet', 'mdi:google-spreadsheet'],
  ['translation', 'mdi:translate'],
  ['dropbox', 'simple-icons:dropbox'],
  ['newsletter', 'mdi:email-newsletter'],
  ['banner', 'mdi:image-multiple'],
  ['planning', 'mdi:email-send'],
];

const getLinkIcon = (name: string): string => {
  const lower = name.toLowerCase();
  for (const [key, icon] of LINK_ICON_MAP) {
    if (lower.includes(key)) return icon;
  }
  return 'mdi:link-variant';
};

/** Shorten long field names for display (match old createLinkChip behaviour). */
const getLinkLabel = (name: string): string => {
  return (
    name
      .replace(/translation spreadsheet newsletter/i, 'Translations')
      .replace(/spreadsheet newsletter/i, 'Spreadsheet')
      .replace(/newsletter template/i, 'Newsletter')
      .replace(/Newsletter Campaign banners/i, 'Banners')
      .replace(/Campaign dropbox/i, 'Dropbox')
      .replace(/Figma newsletter link/i, 'Figma')
      .replace(/Newsletter testing issue/i, 'Testing')
      .trim() || name
  );
};

type ActionsPanelProps = {
  tableData: ChecklistTableData | null;
  issueId: number;
  mode?: ChecklistMode;
  showDashboardActions?: boolean;
  issueLinks?: IssueLink[];
  issueDate?: string;
  onGeneratedChecklist?: () => Promise<void> | void;
  onStartPlanning?: (chdeId: string | null) => Promise<void> | void;
};

const toLpDatePath = (issueDate?: string): string | null => {
  if (!issueDate) return null;
  const match = issueDate.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return `/lp${year.slice(-2)}-${month}-${day}/`;
};

const ActionsPanel = ({
  tableData,
  issueId,
  mode,
  showDashboardActions,
  issueLinks = [],
  issueDate,
  onGeneratedChecklist,
  onStartPlanning,
}: ActionsPanelProps) => {
  const shouldShowActions = showDashboardActions ?? mode !== 'cgb';
  const shouldShowSLPTUpdater = mode === 'newsletter' || mode === 'sunday';
  const hasLpActions = mode !== 'sunday';
  const hasGroupedNslt = tableData?.hasGroupedNslt ?? false;
  const hasGroupedLp = tableData?.hasGroupedLp ?? false;
  const rows = tableData?.rows ?? [];
  const origin = window.location.origin;
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showSLPTUpdaterModal, setShowSLPTUpdaterModal] = useState(false);

  const chdeNsltId = !tableData?.hasGroupedNslt
    ? (rows.filter(r => r.shop === 'CHDE')[0]?.nsltId ?? null)
    : (rows.filter(r => r.shop === 'CHDE')[0]?.nsltAId ?? null);

  const { newsletterIds, landingPageIds } = useTableDataIds(rows);

  console.log('tableData', tableData);

  const isPlanningAllowed = useMemo(() => {
    if (mode === 'cgb') {
      return false;
    }
    if (mode === 'sunday') {
      return rows.length > 0 && rows.every(r => r.columnStatuses.nsltAccepted === 1);
    }
    return true;
  }, [mode, rows]);

  const filteredRows = useMemo(() => {
  if (mode === 'sunday') {
    return rows.filter(row => row.nsltId);
  }
 return rows.filter(row => {
    const hasNewsletterId = !!(row.nsltId || row.nsltAId || row.nsltBId);
    const hasLandingPageOnly = !!(row.lpId && !row.nsltId && !row.nsltAId && !row.nsltBId);
    return hasNewsletterId || hasLandingPageOnly;
  });
}, [rows, mode]);

console.log('filteredRows', filteredRows);


  const buildNsltLinks = (idKey: 'nsltId' | 'nsltAId' | 'nsltBId') =>
    rows.filter(r => !!r[idKey]).map(r => `${r.shop}\t${origin}/news_email.php?id=${r[idKey]}`);

  const buildLpLinks = () =>
    rows
      .filter(r => r.lpId)
      .map(r => {
        const shopId = getShopId(r.shop);
        return shopId ? `${r.shop}\t${origin}/shop_content.php?id=${r.lpId}&shop_id=${shopId}` : null;
      })
      .filter((url): url is string => url !== null);

  const buildLpShopsLinks = () => {
    const lpPath = toLpDatePath(issueDate);
    if (!lpPath) return [];

    return LP_SHOPS_ORDER.map(shop => {
      const domain = SHOP_DOMAIN_MAP[shop];
      if (!domain) return null;
      return `${shop}\t${domain}/content${lpPath}`;
    }).filter((v): v is string => v !== null);
  };

  const useCopyButton = (getLinks: () => string[]) => {
    const [copied, setCopied] = useState(false);
    const onClick = useCallback(() => {
      const text = getLinks().join('\n');
      if (!text) return;
      void navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }, [getLinks]);
    return { copied, onClick };
  };

  const useOpenButton = (getLinks: () => string[]) => {
    const onClick = useCallback(() => {
      const links = getLinks();
      if (!links.length) return;
      links.forEach(link => {
        const url = link.split('\t')[1];
        if (url) {
          window.open(url, '_blank');
        }
      });
    }, [getLinks]);
    return { onClick };
  };

  const nslt = useCopyButton(useCallback(() => buildNsltLinks('nsltId'), [rows, origin]));
  const nsltA = useCopyButton(useCallback(() => buildNsltLinks('nsltAId'), [rows, origin]));
  const nsltB = useCopyButton(useCallback(() => buildNsltLinks('nsltBId'), [rows, origin]));
  const lp = useCopyButton(useCallback(() => buildLpLinks(), [rows, origin]));
  const lpShops = useCopyButton(useCallback(() => buildLpShopsLinks(), [issueDate]));

  const openNslt = useOpenButton(useCallback(() => buildNsltLinks('nsltId'), [rows, origin]));
  const openNsltA = useOpenButton(useCallback(() => buildNsltLinks('nsltAId'), [rows, origin]));
  const openNsltB = useOpenButton(useCallback(() => buildNsltLinks('nsltBId'), [rows, origin]));
  const openLp = useOpenButton(useCallback(() => buildLpLinks(), [rows, origin]));
  const openLpShops = useOpenButton(useCallback(() => buildLpShopsLinks(), [issueDate]));

  return (
    <div className={styles.rightPanel}>
      {/* links from response.additional_fields */}
      {issueLinks.length > 0 && (
        <div className={styles.linkChipsRow}>
          {issueLinks.map(link => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkChip}
              title={link.name}
            >
              <Icon icon={getLinkIcon(link.name)} width="14" height="14" />
              {getLinkLabel(link.name)}
            </a>
          ))}
        </div>
      )}

      {shouldShowActions && (
        <div className={styles.actionsContainer}>
          <div className={styles.actionsGrid}>
            {shouldShowSLPTUpdater && (
              <ActionButton
                variant="primary"
                label={mode === 'newsletter' ? 'Update SL/PT' : 'Update SL'}
                icon="mdi:format-title"
                onClick={() => setShowSLPTUpdaterModal(true)}
              />
            )}
            <ActionButton
              variant="primary"
              label="Generate Checklists"
              icon="mdi:auto-fix"
              onClick={() => setShowGenerateModal(true)}
            />

            <div className={styles.dropdownWrapper}>
              <ActionButton
                variant="ghost"
                label="Copy..."
                icon="mdi:content-copy"
                onClick={() => {}}
								
              />
              <div className={styles.dropdownMenu}>
                {hasGroupedNslt ? (
                  <>
                    <ActionButton
                      variant="ghost"
                      label="Copy NSLT A Prolo"
                      icon="mdi:link-variant"
                      copied={nsltA.copied}
                      onClick={nsltA.onClick}
                    />
                    <ActionButton
                      variant="ghost"
                      label="Copy NSLT B Prolo"
                      icon="mdi:link-variant"
                      copied={nsltB.copied}
                      onClick={nsltB.onClick}
                    />
                  </>
                ) : (
                  <ActionButton
                    variant="ghost"
                    label="Copy NSLT Prolo"
                    icon="mdi:link-variant"
                    copied={nslt.copied}
                    onClick={nslt.onClick}
                  />
                )}

                {hasLpActions && (
                  <>
                    <ActionButton
                      variant="ghost"
                      label="Copy LP Prolo"
                      icon="mdi:link-variant"
                      copied={lp.copied}
                      onClick={lp.onClick}
                    />
                    <ActionButton
                      variant="ghost"
                      label="Copy LP Shops"
                      icon="mdi:web"
                      copied={lpShops.copied}
                      onClick={lpShops.onClick}
                    />
                  </>
                )}
              </div>
            </div>

            <div className={styles.dropdownWrapper}>
              <ActionButton
                variant="ghost"
                label="Open..."
                icon="mdi:open-in-new"
                onClick={() => {}}
              />
              <div className={styles.dropdownMenu}>
                {hasGroupedNslt ? (
                  <>
                    <ActionButton
                      variant="ghost"
                      label="Open NSLT A Prolo"
                      icon="mdi:link-variant"
                      onClick={openNsltA.onClick}
                    />
                    <ActionButton
                      variant="ghost"
                      label="Open NSLT B Prolo"
                      icon="mdi:link-variant"
                      onClick={openNsltB.onClick}
                    />
                  </>
                ) : (
                  <ActionButton
                    variant="ghost"
                    label="Open NSLT Prolo"
                    icon="mdi:link-variant"
                    onClick={openNslt.onClick}
                  />
                )}

                {hasLpActions && (
                  <>
                    <ActionButton
                      variant="ghost"
                      label="Open LP Prolo"
                      icon="mdi:link-variant"
                      onClick={openLp.onClick}
                    />
                    <ActionButton
                      variant="ghost"
                      label="Open LP Shops"
                      icon="mdi:web"
                      onClick={openLpShops.onClick}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {isPlanningAllowed && (
            <ActionButton
              variant="primary"
              label="Start Planning"
              icon="mdi:web"
              onClick={() => setShowPlanningModal(true)}
            />
          )}
        </div>
      )}

      <div className={chatStyles.chatPreview}>
        <div className={chatStyles.chatPreviewHeader}>
          <h3>Chat Preview</h3>
          <div className={chatStyles.chatHeaderButtons} id={`chat-buttons-${issueId}`}></div>
        </div>
        <div className={chatStyles.chatContent}>
          <CommentsView issueId={issueId} mode={mode} />
        </div>
      </div>

      {showGenerateModal && shouldShowActions && (
        <GenerateChecklistModal
          issueId={issueId}
          mode={mode}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            void onGeneratedChecklist?.();
          }}
        />
      )}
      {showPlanningModal && shouldShowActions && (
        <PlanningModal
          issueId={issueId}
          mode={mode}
          chdeId={chdeNsltId}
          onClose={() => setShowPlanningModal(false)}
          onSuccess={() => {
            void onStartPlanning?.(chdeNsltId);
          }}
          tableData={tableData}
          isABTesting={hasGroupedNslt}
          isTwoLP={hasGroupedLp}
          allowSelection={true}
        />
      )}
      {showSLPTUpdaterModal && shouldShowActions && (
        <UpdaterModal
          rows={filteredRows}
          issueId={issueId}
          newsletterIds={newsletterIds}
          landingPageIds={landingPageIds}
          onClose={() => setShowSLPTUpdaterModal(false)}
        />
      )}
    </div>
  );
};

export default ActionsPanel;
