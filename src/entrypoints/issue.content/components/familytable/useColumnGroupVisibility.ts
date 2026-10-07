import { useCallback, useMemo } from 'react';
import { useCookies } from 'react-cookie';

const COOKIE_KEY = 'checklist_hidden_column_groups_v2';
const cookieOptions = { path: '/', maxAge: 7 * 24 * 60 * 60 };

const parseHiddenGroups = (value: unknown): Set<string> => {
  if (typeof value !== 'string' || !value) return new Set();
  return new Set(value.split(','));
};

export const useColumnGroupVisibility = () => {
  const [cookies, setCookie] = useCookies([COOKIE_KEY]);
  const hiddenGroups = useMemo(() => parseHiddenGroups(cookies[COOKIE_KEY]), [cookies]);

  const toggleGroup = useCallback(
    (key: string) => {
      const next = new Set(hiddenGroups);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      setCookie(COOKIE_KEY, Array.from(next).join(','), cookieOptions);
    },
    [hiddenGroups, setCookie],
  );

  return { hiddenGroups, toggleGroup };
};
