import { useState } from 'react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import { generateChecklist } from '../api/checklistGeneration';
import type { ChecklistMode, ChecklistTableData } from '../lib/types';
import {
  fetchCustomerCountsForNewsletters,
  newsletterSlugs,
  NUMBER_OF_NEWSLETTERS,
  sendToSpam,
  SendToSpamParams,
  slugToIdMap,
  usernameToIdMap,
} from '../api/planning';

type PlanningModalProps = {
  issueId: number;
  chdeId: string | null;
  mode?: ChecklistMode;
  onClose: () => void;
  onSuccess?: () => void;
  tableData?: ChecklistTableData | null;
  isABTesting?: boolean;
};

const PlanningModal = ({ issueId, chdeId, mode, onClose, onSuccess, tableData, isABTesting }: PlanningModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsletterTitle, setNewsletterTitle] = useState<string | null>(null);
  const [planningProgress, setPlanningProgress] = useState<{
    current: number;
    total: number;
    results: Array<{ slug: string; customers: number; status: 'pending' | 'success' | 'error';  type: 'A' | 'B'; newsletterId: number;error?: string }>;
  }>({
    current: 0,
    total: 0,
    results: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [newsletterIdMap, setNewsletterIdMap] = useState<Map<string, Array<{ type: 'A' | 'B'; newsletterId: number }>>>(
    new Map(),
  );

  useEffect(() => {
    if (tableData && chdeId) {
      const startId = parseInt(chdeId, 10);
      const idMap = new Map<string, Array<{ type: 'A' | 'B'; newsletterId: number }>>();

      let currentId = startId;

      for (let i = 1; i <= NUMBER_OF_NEWSLETTERS; i++) {
        const slug = newsletterSlugs[i];
        const row = tableData.rows.find(r => r.shop === slug);

        const ids: Array<{ type: 'A' | 'B'; newsletterId: number }> = [];

        ids.push({ type: 'A', newsletterId: currentId });
        currentId++;

        if (row?.nsltBId) {
          ids.push({ type: 'B', newsletterId: parseInt(row.nsltBId, 10) });
        }
        idMap.set(slug, ids);
      }

      setNewsletterIdMap(idMap);
    }
  }, [tableData, chdeId]);

  useEffect(() => {
    setLoading(true);
    const fetchNewsletterTitle = async () => {
      try {
        const response = await fetch(`https://www.prologistics.info/api/issueLog/list/?page_id=${issueId}`);
        const data = await response.json();
        const title = data?.issue_list?.[0]?.issue;
        setNewsletterTitle(title || null);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch newsletter title:', err);
        setError(`Failed to fetch newsletter title.`);
        setNewsletterTitle(null);
        setLoading(false);
      }
    };

    fetchNewsletterTitle();
  }, [issueId]);

  // https://www.prologistics.info/api/issueLog/list/?page_id=466278

  const handlePlanning = async () => {
    if (!chdeId) {
      setError('CHDE ID not found in table data.');
      return;
    }

    setLoading(true);
    setError(null);
    setShowResults(false);

    const results: Array<{
      slug: string;
      type: 'A' | 'B';
      newsletterId: number;
      customers: number;
      status: 'pending' | 'success' | 'error';
      error?: string;
    }> = [];

    const allEntries: Array<{ slug: string; type: 'A' | 'B'; newsletterId: number; shopId: number; username: string }> =
      [];

    for (const [slug, ids] of newsletterIdMap.entries()) {
      const shopId = slugToIdMap[slug];
      const username = Object.keys(usernameToIdMap).find(key => usernameToIdMap[key] === shopId);

      if (!shopId || !username) {
        console.warn(`Missing shopId or username for slug ${slug}: shopId=${shopId}, username=${username}`);
        continue;
      }
      for (const { type, newsletterId } of ids) {
        allEntries.push({ slug, type, newsletterId, shopId: +shopId, username: username });

        results.push({ slug, type, newsletterId, customers: 0, status: 'pending' });
      }
    }

    setPlanningProgress({
      current: 0,
      total: allEntries.length,
      results: results.map(r => ({ ...r, customers: 0, status: 'pending' as const })),
    });

    const groupedBySlug = new Map<string, typeof allEntries>();
    for (const entry of allEntries) {
      if (!groupedBySlug.has(entry.slug)) {
        groupedBySlug.set(entry.slug, []);
      }
      groupedBySlug.get(entry.slug)!.push(entry);
    }

    let processedCount = 0;
    const allNewsletterIds: number[] = [];

    for (const [slug, entries] of groupedBySlug.entries()) {
      const isABTest = entries.length === 2;
      const newsletterIds = entries.map(e => e.newsletterId);
      allNewsletterIds.push(...newsletterIds);

      const shopId = entries[0].shopId;
      const username = entries[0].username;

      try {
        const response = await sendToSpam({
          usernameReg: username,
          shopId: shopId,
          newsletterIds: newsletterIds,
          newsletterSlug: slug,
          isABTest,
        });
        const responseData = await response.json();

        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const resultIndex = results.findIndex(r => r.newsletterId === entry.newsletterId);

          if (resultIndex !== -1) {
            results[resultIndex].status = 'success';
          }
        }
        console.log(`✅ ${slug}: sent successfully`);
      } catch (err) {
        console.error(`❌ Failed for ${slug}:`, err);
        for (const entry of entries) {
          const resultIndex = results.findIndex(r => r.newsletterId === entry.newsletterId);
          if (resultIndex !== -1) {
            results[resultIndex].status = 'error';
            results[resultIndex].error = err instanceof Error ? err.message : 'Unknown error';
          }
        }
      }

      processedCount += entries.length;
      setPlanningProgress(prev => ({
        ...prev,
        current: processedCount,
        results: [...results],
      }));
    }

    console.log('All newsletters sent. Fetching customer counts for IDs: ', allNewsletterIds);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('Fetching spam plan for newsletter IDs:', allNewsletterIds);

      const customerCountMap = await fetchCustomerCountsForNewsletters(allNewsletterIds);

      console.log('Customer count map entries:', Array.from(customerCountMap.entries()));

      let updatedResults = results.map(result => {
        const customerCount = customerCountMap.get(result.newsletterId);
        if (customerCount !== undefined) {
          console.log(`Found data for newsletter ${result.newsletterId} (${result.slug}): ${customerCount} customers`);

          return { ...result, customers: customerCount };
        } else {
          console.warn(`No spam plan data found for newsletter ${result.newsletterId} (${result.slug})`);
          return result;
        }
      });

      for (const [slug, entries] of groupedBySlug.entries()) {
        if (entries.length === 2) {
          const aEntry = entries.find(e => e.type === 'A');
          const bEntry = entries.find(e => e.type === 'B');

          if (aEntry && bEntry) {
            const aResult = updatedResults.find(r => r.newsletterId === aEntry.newsletterId);
            const bResult = updatedResults.find(r => r.newsletterId === bEntry.newsletterId);

            if (aResult && bResult) {
              const totalCustomers = (aResult.customers || 0) + (bResult.customers || 0);

              updatedResults = updatedResults.map(r => {
                if (r.newsletterId === aEntry.newsletterId || r.newsletterId === bEntry.newsletterId) {
                  return { ...r, customers: totalCustomers };
                }
                return r;
              });
              console.log(
                `📊 ${slug} AB Test total: ${totalCustomers} customers (A: ${aResult.customers}, B: ${bResult.customers})`,
              );
            }
          }
        }
      }

      setPlanningProgress(prev => ({
        ...prev,
        results: updatedResults,
      }));

      const shopTotals = new Map<string, number>();
      for (const result of updatedResults) {
        const currentTotal = shopTotals.get(result.slug) || 0;
        if (!shopTotals.has(result.slug)) {
          shopTotals.set(result.slug, result.customers);
        }
      }

      const totalCustomers = Array.from(shopTotals.values()).reduce((sum, count) => sum + count, 0);
      console.log(`Total customers across all newsletters: ${totalCustomers}`);
    } catch (err) {
      console.error('Failed to fetch spam plan data:', err);
      setError('Failed to fetch customer counts: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }

    setLoading(false);
    setShowResults(true);
  };

  const copyResultsToClipboard = () => {
    const text = planningProgress.results.map(r => r.customers).join('\n');
    void navigator.clipboard.writeText(text);
  };

  const getTotalCustomers = () => {
    return planningProgress.results.reduce((sum, r) => sum + r.customers, 0);
  };

  return (
    <div className={clsx(formStyles.modalOverlay, layoutStyles.visible)} onClick={onClose}>
      <div className={clsx(formStyles.modal)} onClick={e => e.stopPropagation()}>
        <div className={formStyles.modalHeader}>
          <h2>{showResults ? 'Planning Results' : 'Start Planning'}</h2>
          <button className={formStyles.closeBtn} onClick={onClose}>
            <Icon icon="mdi:close" width="20" height="20" />
          </button>
        </div>

        <div className={formStyles.modalContent}>
          {error && <div className={clsx(formStyles.error, formStyles.formError)}>{error}</div>}

          {!showResults ? (
            <>
              <div className={formStyles.formGroup}>
                <div>
                  <strong>Newsletter:</strong> {loading ? 'Loading...' : newsletterTitle?.split('SL')[0]}
                </div>
                <div>
                  <strong>Subject Line:</strong> {loading ? 'Loading...' : newsletterTitle?.split('SL')[1]}
                </div>
                <div>
                  <strong>CHDE ID:</strong> {chdeId}
                </div>
                {isABTesting && (
                  <div>
                    <strong>AB Test:</strong> Yes
                  </div>
                )}
                {planningProgress.current > 0 && (
                  <div>
                    <strong>Progress:</strong> {planningProgress.current} / {planningProgress.total} shops
                    <div style={{ marginTop: '8px', height: '4px', background: '#e0e0e0', borderRadius: '2px' }}>
                      <div
                        style={{
                          width: `${(planningProgress.current / planningProgress.total) * 100}%`,
                          height: '100%',
                          background: '#4caf50',
                          borderRadius: '2px',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                )}
                {planningProgress.current > 0 &&
                  planningProgress.results.slice(0, planningProgress.current).map((r, index) => (
                    <div key={`${r.slug}-${r.type}-${index}`} style={{ fontSize: '12px', marginTop: '4px' }}>
                      {r.status === 'success' && `✅ ${r.slug}: ${r.customers} customers`}
                      {r.status === 'error' && `❌ ${r.slug}: ${r.error}`}
                      {r.status === 'pending' && `⏳ ${r.slug}: Pending...`}
                    </div>
                  ))}
              </div>

              <div className={formStyles.modalButtons}>
                <button
                  className={clsx(formStyles.btn, formStyles['btn--primary'])}
                  onClick={() => void handlePlanning()}
                  disabled={loading}
                >
                  <Icon
                    icon={loading ? 'mdi:loading' : 'mdi:playlist-plus'}
                    width="14"
                    height="14"
                    className={loading ? formStyles.spinning : ''}
                  />
                  {loading ? 'Planning...' : 'Start Planning'}
                </button>

                <button className={clsx(formStyles.btn, formStyles['btn--ghost'])} onClick={onClose} disabled={loading}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={formStyles.formGroup}>
                <div>
                  <strong>Total Customers:</strong> {getTotalCustomers().toLocaleString()}
                </div>
                <div>
                  <strong>Successful Shops:</strong>{' '}
                  {planningProgress.results.filter(r => r.status === 'success').length} / {planningProgress.total}
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Shop</th>
                        <th style={{ textAlign: 'right', padding: '8px' }}>Customers</th>
                        <th style={{ textAlign: 'center', padding: '8px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planningProgress.results.map(r => (
                        <tr key={r.slug} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px' }}>{r.slug}</td>
                          <td style={{ textAlign: 'right', padding: '8px' }}>
                            {r.status === 'success' ? r.customers.toLocaleString() : '-'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '8px' }}>
                            {r.status === 'success' && '✅'}
                            {r.status === 'error' && '❌'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={formStyles.modalButtons}>
                <button className={clsx(formStyles.btn, formStyles['btn--primary'])} onClick={copyResultsToClipboard}>
                  <Icon icon="mdi:content-copy" width="14" height="14" />
                  Copy Results
                </button>

                <button
                  className={clsx(formStyles.btn, formStyles['btn--ghost'])}
                  onClick={() => {
                    setShowResults(false);
                    onSuccess?.();
                    onClose();
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanningModal;
