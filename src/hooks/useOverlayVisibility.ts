import { useCallback, useMemo, useState } from 'react';
import { useCookies } from 'react-cookie';

const cookieOptions = { maxAge: 7 * 24 * 60 * 60 };

const readVisibilityFromCookie = (value: unknown, fallbackVisible: boolean) => {
  if (value === undefined) {
    return fallbackVisible;
  }

  return value !== 'false' && value !== false;
};

const useOverlayVisibility = (cookieKey: string, fallbackVisible = true) => {
  const [cookies, setCookie] = useCookies([cookieKey]);
  const [visible, setVisible] = useState(() => readVisibilityFromCookie(cookies[cookieKey], fallbackVisible));

  const setOverlayVisibility = useCallback(
    (nextVisible: boolean) => {
      setVisible(nextVisible);
      setCookie(cookieKey, String(nextVisible), cookieOptions);
    },
    [cookieKey, setCookie],
  );

  return useMemo(
    () => ({
      visible,
      showOverlay: () => setOverlayVisibility(true),
      hideOverlay: () => setOverlayVisibility(false),
    }),
    [setOverlayVisibility, visible],
  );
};

export default useOverlayVisibility;
