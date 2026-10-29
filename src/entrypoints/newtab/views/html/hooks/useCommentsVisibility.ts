import { useState, useEffect, useRef } from 'react';

const DEFAULT_HIDDEN_KEY = 'local:commentsDefaultHidden';
const LAST_SEEN_KEY = 'local:commentsLastSeen';

export function useCommentsVisibility() {
  const [showComments, setShowComments] = useState(false);
  const [defaultHidden, setDefaultHidden] = useState(true);
  const [lastSeen, setLastSeen] = useState<number | null | undefined>(undefined);
  const [highlightNewerThan, setHighlightNewerThan] = useState<number | null>(null);
  const lastSeenRef = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    Promise.all([storage.getItem<boolean>(DEFAULT_HIDDEN_KEY), storage.getItem<number>(LAST_SEEN_KEY)]).then(
      ([savedDefaultHidden, savedLastSeen]) => {
        const hidden = savedDefaultHidden ?? true;
        lastSeenRef.current = savedLastSeen ?? null;
        setDefaultHidden(hidden);
        setShowComments(!hidden);
        setLastSeen(savedLastSeen ?? null);
      },
    );
  }, []);

  const toggleDefaultHidden = () => {
    const next = !defaultHidden;
    setDefaultHidden(next);
    storage.setItem(DEFAULT_HIDDEN_KEY, next);
  };

  const markSeen = (resetHighlight: boolean) => {
    if (lastSeenRef.current === undefined) return;
    if (resetHighlight) {
      setHighlightNewerThan(lastSeenRef.current ?? 0);
    }
    const now = Date.now();
    lastSeenRef.current = now;
    setLastSeen(now);
    storage.setItem(LAST_SEEN_KEY, now);
  };

  return {
    showComments,
    setShowComments,
    defaultHidden,
    toggleDefaultHidden,
    lastSeen,
    highlightNewerThan,
    markSeen,
  };
}
