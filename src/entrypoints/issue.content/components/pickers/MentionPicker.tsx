import { useState, useMemo, useEffect } from 'react';
import styles from './Picker.module.scss';
import { fetchMentionableUsers } from '../../api/issueData';
import { MentionUser } from '../../lib/types';

type MentionPickerProps = {
  commentUsers: MentionUser[];
  onSelect: (userId: string, value: string) => void;
  onClose: () => void;
  // innline in chat
  externalQuery?: string;
};

const UserButton = ({ user, onSelect }: { user: MentionUser; onSelect: MentionPickerProps['onSelect'] }) => (
  <button key={user.id} className={styles.userButton} onClick={() => onSelect(user.id, user.value)}>
    <span className={styles.userName}>{user.value}</span>
    <span className={styles.userId}>@{user.id}</span>
  </button>
);

export const MentionPicker = ({ commentUsers, onSelect, externalQuery }: MentionPickerProps) => {
  const [search, setSearch] = useState('');
  const [apiUsers, setApiUsers] = useState<MentionUser[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const isInlineMode = externalQuery !== undefined;

  useEffect(() => {
    let cancelled = false;
    fetchMentionableUsers().then(list => {
      if (!cancelled) {
        setApiUsers(list);
        setApiLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const query = (isInlineMode ? externalQuery : search).trim().toLowerCase();

  // filter + deduplicate against apiUsers ids
  const filteredCommentUsers = useMemo(() => {
    const apiIds = new Set(apiUsers.map(u => u.id));
    return commentUsers
      .filter(u => u.id !== '0' && u.value.toUpperCase() !== 'NONE')
      .filter(u => !apiIds.has(u.id))
      .filter(u => !query || u.value.toLowerCase().includes(query));
  }, [commentUsers, apiUsers, query]);

  const filteredApiUsers = useMemo(() => {
    return apiUsers.filter(u => !query || u.value.toLowerCase().includes(query));
  }, [apiUsers, query]);

  const hasResults = filteredCommentUsers.length > 0 || filteredApiUsers.length > 0;

  return (
    <div className={`${styles.pickerPanel} ${styles.mentionPanel}`}>
      {!isInlineMode && (
        <input
          type="text"
          placeholder="Search users..."
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      )}
      <div className={styles.userList}>
        {filteredCommentUsers.length > 0 && (
          <>
            {filteredCommentUsers.map(user => (
              <UserButton key={user.id} user={user} onSelect={onSelect} />
            ))}
            {(filteredApiUsers.length > 0 || apiLoading) && <div className={styles.sectionDivider} />}
          </>
        )}
        {filteredApiUsers.map(user => (
          <UserButton key={user.id} user={user} onSelect={onSelect} />
        ))}
        {apiLoading && filteredCommentUsers.length === 0 && <div className={styles.emptyState}>Loading...</div>}
        {!apiLoading && !hasResults && <div className={styles.emptyState}>No users found</div>}
      </div>
      <div className={styles.pickerFooter}>
        <small>{apiLoading ? `${commentUsers.length} from chat` : `${apiUsers.length} users`}</small>
      </div>
    </div>
  );
};
