import { CustomerOption, extractEmailFromValue, fetchCustomerByEmail, getUserEmail, parseCustomerIdFromValue, SEND_TO_USERS, setTestCustomerAndSend } from '../../utils/sendTest';
import styles from './SendTestControls.module.scss';

export default function SendTestControls() {
  const [selfCustomer, setSelfCustomer] = useState<CustomerOption | null>(null);
  const [selfEmail, setSelfEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("sendTestControls");
    
    const email = getUserEmail();
    if (!email) {
      setLoading(false);
      return;
    }

    setSelfEmail(email);

    fetchCustomerByEmail(email)
      .then(customer => {
        setSelfCustomer(customer);
      })
      .catch(err => console.error('Failed to fetch customer:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectChange = (value: string) => {
    if (!value) return;

    const email = extractEmailFromValue(value);
    if (email.includes('@')) {
      if (!confirm(`Are you sure you want to send test to ${email}?`)) {
        return;
      }
    }

    const customerId = parseCustomerIdFromValue(value);
    setTestCustomerAndSend(value, customerId);
  };

  const handleSendToSelf = () => {
    if (!selfCustomer || !selfEmail) return;

    const mailTo = `Shop#${selfCustomer.id.replace('-', '')}:${selfEmail}`;
    setTestCustomerAndSend(mailTo, selfCustomer.id);
  };

  if (loading) return null;

  return (
    <div className={styles.container}>
      <label className={styles.label}>Send to:</label>

      <select
        className={styles.select}
        defaultValue=""
        onChange={e => {
          handleSelectChange(e.target.value);
          e.target.value = ''; // reset so same option can be selected again
        }}
      >
        <option value="" disabled>
          Select user…
        </option>

        {Object.entries(SEND_TO_USERS).map(([groupName, users]) => (
          <optgroup key={groupName} label={groupName}>
            {Object.entries(users).map(([key, value]) => {
              const email = extractEmailFromValue(value);
              return (
                <option key={key} value={value}>
                  {email}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>

      {selfEmail && (
        <button type="button" className={styles.selfButton} onClick={handleSendToSelf}>
          {selfEmail}
        </button>
      )}
    </div>
  );
}