import { useEffect } from 'react';

export function useHideAlertifyLogs() {
  useEffect(() => {
    const hideAlert = () => {
      const alertElement = document.querySelector('.alertify-logs .custom-log.danger');
      if (alertElement) {
        (alertElement as HTMLElement).style.display = 'none';
      }
    };

    hideAlert();

    const style = document.createElement('style');
    style.textContent = `.alertify-logs .custom-log.danger { display: none !important; }`;
    document.head.appendChild(style);

    const observer = new MutationObserver(() => hideAlert());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, []);
}
