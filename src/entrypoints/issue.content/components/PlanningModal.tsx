import { useState } from 'react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import formStyles from '../styles/forms.module.scss';
import layoutStyles from '../styles/layout.module.scss';
import { generateChecklist } from '../api/checklistGeneration';
import type { ChecklistMode } from '../lib/types';
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
};

const PlanningModal = ({ issueId, chdeId, mode, onClose, onSuccess }: PlanningModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsletterTitle, setNewsletterTitle] = useState<string | null>(null);
  const [planningProgress, setPlanningProgress] = useState<{
    current: number;
    total: number;
    results: Array<{ slug: string; customers: number; status: 'pending' | 'success' | 'error'; error?: string }>;
  }>({
    current: 0,
    total: 0,
    results: [],
  });
  const [showResults, setShowResults] = useState(false);

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

    let currentId = +chdeId;
    const totalNewsletters = NUMBER_OF_NEWSLETTERS;

    const sentNewsletterIds: number[] = [];

    const results: Array<{
      slug: string;
      newsletterId: number;
      customers: number;
      status: 'pending' | 'success' | 'error';
      error?: string;
    }> = [];

    for (let i = 1; i <= totalNewsletters; i++) {
      const newsletterSlug = newsletterSlugs[i];
      const newsletterId = currentId + i - 1;
      results.push({ slug: newsletterSlug, newsletterId, customers: 0, status: 'pending' });
      sentNewsletterIds.push(newsletterId);
    }

    setPlanningProgress({ current: 0, total: totalNewsletters, results });

    for (let i = 1; i <= totalNewsletters; i++) {
      const newsletterSlug = newsletterSlugs[i];
      const shopId = slugToIdMap[newsletterSlug];
      const newsletterId = currentId + i - 1;

      if (!shopId) {
        console.warn(`Shop ID not found for newsletter slug: ${newsletterSlug}`);
        results[i - 1].status = 'error';
        results[i - 1].error = `Shop ID not found for ${newsletterSlug}`;
        setPlanningProgress(prev => ({ ...prev, current: i, results: [...results] }));
        continue;
      }

      const username = (Object.keys(usernameToIdMap) as Array<string>).find(key => usernameToIdMap[key] === shopId);

      if (!username) {
        console.warn(`Username not found for shop ID: ${shopId}`);
        results[i - 1].status = 'error';
        results[i - 1].error = `Username not found for shop ${newsletterSlug}`;
        setPlanningProgress(prev => ({ ...prev, current: i, results: [...results] }));
        continue;
      }

      console.log('NSLT ID:', currentId, 'Newsletter:', newsletterSlug, 'Shop ID:', shopId, 'Username:', username);

      const spamParams: SendToSpamParams = {
        usernameReg: username || '',
        shopId: Number(shopId),
        newsletterId: newsletterId,
        newsletterSlug,
      };

      try {
        const response = await sendToSpam(spamParams);
        const responseData = await response.json();
        const customerNumber = responseData?.debug?.final_customers_number || 0;

        results[i - 1].status = 'success';
        results[i - 1].customers = customerNumber;

        console.log(`✅ ${newsletterSlug}: ${customerNumber} customers`);
      } catch (err) {
        console.error(`❌ Failed for ${newsletterSlug}:`, err);
        results[i - 1].status = 'error';
        results[i - 1].error = err instanceof Error ? err.message : 'Unknown error';
      }

      setPlanningProgress(prev => ({
        ...prev,
        current: i,
        results: [...results],
      }));
    }

    console.log('All newsletters sent. Fetching customer counts for IDs: ', sentNewsletterIds);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const customerCountMap = await fetchCustomerCountsForNewsletters(sentNewsletterIds);

      const updatedResults = results.map(result => {
        const customerCount = customerCountMap.get(result.newsletterId);
        if (customerCount !== undefined) {
          console.log(`Found data for newsletter ${result.newsletterId} (${result.slug}): ${customerCount} customers`);

          return { ...result, customers: customerCount };
        } else {
          console.warn(`No spam plan data found for newsletter ${result.newsletterId} (${result.slug})`);
          return result;
        }
      });

      setPlanningProgress(prev => ({
        ...prev,
        results: updatedResults,
      }));

      const totalCustomers = Array.from(customerCountMap.values()).reduce((sum, count) => sum + count, 0);
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
                  planningProgress.results.slice(0, planningProgress.current).map(r => (
                    <div key={r.slug} style={{ fontSize: '12px', marginTop: '4px' }}>
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
