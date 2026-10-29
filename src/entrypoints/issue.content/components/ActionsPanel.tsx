import { useState, useCallback, useEffect } from 'react';
import styles from '../styles/layout.module.scss';
import chatStyles from '../styles/chat.module.scss';
import { CommentsView } from './CommentsView';
import GenerateChecklistModal from './GenerateChecklistModal';
import type { ChecklistMode, ChecklistTableData } from '../lib/types';
import ActionsMenu, { type ActionsMenuItem } from './ActionsMenu';
import { getShopId } from '../lib/shopIdMap';
import { LP_SHOPS_ORDER, SHOP_DOMAIN_MAP } from '../lib/shopConfig';
import { fetchLandingPageAliases } from '../api/shopContentService';
import PlanningModal from './PlanningModal';
import UpdaterModal from './UpdaterModal';
import { START_PLANNING_EVENT } from '../lib/dashboardEvents';
import { isPlanningAllowed } from '@/entrypoints/issue.content/utils/planning/isPlanningAllowed';
import { useTableDataIds } from '@/entrypoints/issue.content/utils/updater/hooks/useTableDataIds';

type ActionsPanelProps = {
  tableData: ChecklistTableData | null;
  issueId: number;
  mode?: ChecklistMode;
  showDashboardActions?: boolean;
  showRenameChecklists?: boolean;
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
  showRenameChecklists = false,
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

  const canPlan = shouldShowActions && isPlanningAllowed(mode, rows);
  useEffect(() => {
    if (!canPlan) return;
    const open = () => setShowPlanningModal(true);
    document.addEventListener(START_PLANNING_EVENT, open);
    return () => document.removeEventListener(START_PLANNING_EVENT, open);
  }, [canPlan]);

  const filteredRows = useMemo(() => {
    if (mode === 'sunday') {
      return rows.filter(row => row.nsltId);
    }
    return rows.filter(row => {
      const hasNewsletterId = Boolean(row.nsltId || row.nsltAId || row.nsltBId);
      const hasLandingPageId = Boolean(row.lpId || row.lpAId || row.lpBId);
      const hasLandingPageOnly = hasLandingPageId && !hasNewsletterId;

      return hasNewsletterId || hasLandingPageOnly;
    });
  }, [rows, mode]);

  const buildNsltLinks = (idKey: 'nsltId' | 'nsltAId' | 'nsltBId') =>
    rows.filter(r => !!r[idKey]).map(r => `${r.shop}\t${origin}/news_email.php?id=${r[idKey]}`);

  const buildLpLinksFor = (idKey: 'lpId' | 'lpAId' | 'lpBId') =>
    rows
      .filter(r => r[idKey])
      .map(r => {
        const shopId = getShopId(r.shop);
        return shopId ? `${r.shop}\t${origin}/shop_content.php?id=${r[idKey]}&shop_id=${shopId}` : null;
      })
      .filter((url): url is string => url !== null);

  const buildLpLinks = () => buildLpLinksFor('lpId');

  const buildLpShopsLinks = () => {
    const lpPath = toLpDatePath(issueDate);
    if (!lpPath) return [];

    return LP_SHOPS_ORDER.map(shop => {
      const domain = SHOP_DOMAIN_MAP[shop];
      if (!domain) return null;
      return `${shop}\t${domain}/content${lpPath}`;
    }).filter((v): v is string => v !== null);
  };

  // real alias per shop
  const buildLpShopsTestLinks = async (idKey: 'lpAId' | 'lpBId'): Promise<string[]> => {
    const targets = rows
      .map(r => {
        const lpId = r[idKey];
        const shopId = getShopId(r.shop);
        const domain = SHOP_DOMAIN_MAP[r.shop];
        return lpId && shopId && domain ? { shop: r.shop, lpId, shopId: String(shopId), domain } : null;
      })
      .filter((t): t is { shop: string; lpId: string; shopId: string; domain: string } => t !== null);

    const aliases = await fetchLandingPageAliases(targets);

    return targets
      .map((t, i) => {
        const alias = aliases[i];
        return alias ? `${t.shop}\t${t.domain}/content/${alias}/` : null;
      })
      .filter((url): url is string => url !== null);
  };

  const useCopyButton = (getLinks: () => string[] | Promise<string[]>) => {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const onClick = useCallback(async () => {
      setLoading(true);
      const links = await getLinks();
      setLoading(false);
      const text = links.join('\n');
      if (!text) return;
      void navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }, [getLinks]);
    return { copied, loading, onClick };
  };

  const useOpenButton = (getLinks: () => string[] | Promise<string[]>) => {
    const [loading, setLoading] = useState(false);
    const onClick = useCallback(async () => {
      setLoading(true);
      const links = await getLinks();
      setLoading(false);
      if (!links.length) return;
      links.forEach(link => {
        const url = link.split('\t')[1];
        if (url) {
          window.open(url, '_blank');
        }
      });
    }, [getLinks]);
    return { onClick, loading };
  };

  const nslt = useCopyButton(useCallback(() => buildNsltLinks('nsltId'), [rows, origin]));
  const nsltA = useCopyButton(useCallback(() => buildNsltLinks('nsltAId'), [rows, origin]));
  const nsltB = useCopyButton(useCallback(() => buildNsltLinks('nsltBId'), [rows, origin]));
  const lp = useCopyButton(useCallback(() => buildLpLinks(), [rows, origin]));
  const lpA = useCopyButton(useCallback(() => buildLpLinksFor('lpAId'), [rows, origin]));
  const lpB = useCopyButton(useCallback(() => buildLpLinksFor('lpBId'), [rows, origin]));
  const lpShops = useCopyButton(useCallback(() => buildLpShopsLinks(), [issueDate]));
  const lpShopsTestA = useCopyButton(useCallback(() => buildLpShopsTestLinks('lpAId'), [rows]));
  const lpShopsTestB = useCopyButton(useCallback(() => buildLpShopsTestLinks('lpBId'), [rows]));

  const openNslt = useOpenButton(useCallback(() => buildNsltLinks('nsltId'), [rows, origin]));
  const openNsltA = useOpenButton(useCallback(() => buildNsltLinks('nsltAId'), [rows, origin]));
  const openNsltB = useOpenButton(useCallback(() => buildNsltLinks('nsltBId'), [rows, origin]));
  const openLp = useOpenButton(useCallback(() => buildLpLinks(), [rows, origin]));
  const openLpA = useOpenButton(useCallback(() => buildLpLinksFor('lpAId'), [rows, origin]));
  const openLpB = useOpenButton(useCallback(() => buildLpLinksFor('lpBId'), [rows, origin]));
  const openLpShops = useOpenButton(useCallback(() => buildLpShopsLinks(), [issueDate]));
  const openLpShopsTestA = useOpenButton(useCallback(() => buildLpShopsTestLinks('lpAId'), [rows]));
  const openLpShopsTestB = useOpenButton(useCallback(() => buildLpShopsTestLinks('lpBId'), [rows]));

  const copyItem = (key: string, label: string, icon: string, action: { copied: boolean; loading?: boolean; onClick: () => void }): ActionsMenuItem => ({
    key,
    label: action.loading ? 'Loading...' : label,
    icon,
    done: action.copied,
    disabled: action.loading,
    keepOpen: true,
    onClick: action.onClick,
  });

  const openItem = (key: string, label: string, icon: string, action: { loading?: boolean; onClick: () => void }): ActionsMenuItem => ({
    key,
    label: action.loading ? 'Loading...' : label,
    icon,
    disabled: action.loading,
    onClick: action.onClick,
  });

  const copyItems: ActionsMenuItem[] = [
    ...(hasGroupedNslt
      ? [copyItem('copy-nslt-a', 'NSLT A Prolo', 'mdi:link-variant', nsltA), copyItem('copy-nslt-b', 'NSLT B Prolo', 'mdi:link-variant', nsltB)]
      : [copyItem('copy-nslt', 'NSLT Prolo', 'mdi:link-variant', nslt)]),
    ...(hasLpActions
      ? [
          ...(hasGroupedLp
            ? [copyItem('copy-lp-a', 'Prolo Test A', 'mdi:link-variant', lpA), copyItem('copy-lp-b', 'Prolo Test B', 'mdi:link-variant', lpB)]
            : [copyItem('copy-lp', 'LP Prolo', 'mdi:link-variant', lp)]),
          ...(hasGroupedLp
            ? [copyItem('copy-shop-a', 'Shop Test A', 'mdi:web', lpShopsTestA), copyItem('copy-shop-b', 'Shop Test B', 'mdi:web', lpShopsTestB)]
            : [copyItem('copy-lp-shops', 'LP Shops', 'mdi:web', lpShops)]),
        ]
      : []),
  ];

  const openItems: ActionsMenuItem[] = [
    ...(hasGroupedNslt
      ? [openItem('open-nslt-a', 'NSLT A Prolo', 'mdi:link-variant', openNsltA), openItem('open-nslt-b', 'NSLT B Prolo', 'mdi:link-variant', openNsltB)]
      : [openItem('open-nslt', 'NSLT Prolo', 'mdi:link-variant', openNslt)]),
    ...(hasLpActions
      ? [
          ...(hasGroupedLp
            ? [openItem('open-lp-a', 'Prolo Test A', 'mdi:link-variant', openLpA), openItem('open-lp-b', 'Prolo Test B', 'mdi:link-variant', openLpB)]
            : [openItem('open-lp', 'LP Prolo', 'mdi:link-variant', openLp)]),
          ...(hasGroupedLp
            ? [openItem('open-shop-a', 'Shop Test A', 'mdi:web', openLpShopsTestA), openItem('open-shop-b', 'Shop Test B', 'mdi:web', openLpShopsTestB)]
            : [openItem('open-lp-shops', 'LP Shops', 'mdi:web', openLpShops)]),
        ]
      : []),
  ];

  const menuItems: ActionsMenuItem[] = [
    ...(shouldShowActions
      ? [
          ...(shouldShowSLPTUpdater
            ? [
                {
                  key: 'update-slpt',
                  label: mode === 'newsletter' ? 'Update SL/PT' : 'Update SL',
                  icon: 'mdi:format-title',
                  primary: true,
                  onClick: () => setShowSLPTUpdaterModal(true),
                },
              ]
            : []),
          { key: 'generate', label: 'Generate Checklists', icon: 'mdi:auto-fix', primary: true, onClick: () => setShowGenerateModal(true) },
          { key: 'copy', label: 'Copy...', icon: 'mdi:content-copy', children: copyItems },
          { key: 'open', label: 'Open...', icon: 'mdi:open-in-new', children: openItems },
        ]
      : []),
  ];

  return (
    <div className={styles.rightPanel}>
      <div className={chatStyles.chatPreview}>
        <div className={chatStyles.chatPreviewHeader}>
          <div className={chatStyles.chatHeaderFilters} id={`chat-filters-${issueId}`}></div>
          <div className={chatStyles.chatHeaderRight}>
            <div className={chatStyles.chatHeaderButtons} id={`chat-buttons-${issueId}`}></div>
            <ActionsMenu items={menuItems} />
          </div>
        </div>
        <div className={chatStyles.chatContent}>
          <CommentsView
            issueId={issueId}
            mode={mode}
            showRenameChecklists={showRenameChecklists}
            onRenamed={onGeneratedChecklist}
            rows={tableData?.rows}
          />
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
