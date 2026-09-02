import { createRoot } from 'react-dom/client';
import { PurgeDateBadge } from './PurgeDateBadge';

const BELIANI_HOST_RE = /(^|\.)beliani(\.|$)/i;

export function extractPurgeDate(): string | null {
  return document.body.getAttribute('data-current_date');
}

export function shouldShowPurgeDate(): boolean {
  const host = location.hostname.toLowerCase();
  return BELIANI_HOST_RE.test(host);
}

export function initPurgeDateBadge(): void {
  if (!shouldShowPurgeDate()) return;

  const purgeDate = extractPurgeDate();
  if (!purgeDate) return;

  // Avoid double-mount
  if (document.getElementById('beliani-purge-date-root')) return;

  const mount = document.createElement('div');
  mount.id = 'beliani-purge-date-root';
  document.body.appendChild(mount);

  const root = createRoot(mount);

  const handleClose = () => {
    root.unmount();
    mount.remove();
  };

  root.render(<PurgeDateBadge dateString={purgeDate} onClose={handleClose} />);
}