import { type KeyboardEvent, memo, useState } from 'react';
import styles from '../push.module.scss';

interface InlineEditProps {
  initialValue: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSave: (value: string) => void;
  onCancel?: () => void;
}

/**
 * Small self-contained text editor.
 * The draft lives here, so typing never re-renders the table.
 * It is seeded once on mount — mount it when editing starts.
 * Enter = save, Escape = cancel (if a cancel handler is given).
 */
export const InlineEdit = memo(({ initialValue, placeholder, autoFocus = true, onSave, onCancel }: InlineEditProps) => {
  const [draft, setDraft] = useState(initialValue);
  const trimmed = draft.trim();

  const save = () => {
    if (trimmed) onSave(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className={styles.editContainer}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.inputSmall}
          autoFocus={autoFocus}
        />
      </div>
      <div className={styles.iconGroup}>
        <button type="button" onClick={save} className={styles.iconSave} disabled={!trimmed} title="Save (Enter)">
          ✓
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.iconCancel} title="Cancel (Esc)">
            ✕
          </button>
        )}
      </div>
    </div>
  );
});

InlineEdit.displayName = 'InlineEdit';
