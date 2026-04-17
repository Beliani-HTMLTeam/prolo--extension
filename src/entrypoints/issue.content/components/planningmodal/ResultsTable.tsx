import { PlanningResult } from '@/entrypoints/newtab/types/Planning';

type ResultsTableProps = {
  results: PlanningResult[];
  totalCustomers: number;
  successfulCount: number;
  totalShops: number;
};

export const ResultsTable = ({ results, totalCustomers, successfulCount, totalShops }: ResultsTableProps) => (
  <>
    <div>
      <strong>Total Customers:</strong> {totalCustomers.toLocaleString()}
    </div>
    <div>
      <strong>Successful Shops:</strong> {successfulCount} / {totalShops}
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
          {results.map(r => (
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
  </>
);
