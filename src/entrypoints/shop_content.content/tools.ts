import { ALIAS_TABLE_SELECTOR, deactivateAndUpdate, getShopIdFromUrl, purge, realUpdate } from './actions';

export type FloatingToolConfig = {
  id: string;
  label: string;
  loadingLabel?: string;
  icon: string;
  action: () => void | Promise<void>;
  isAvailable?: () => boolean;
};

export const tools: FloatingToolConfig[] = [
  {
    id: 'real-update',
    label: 'Real update',
    loadingLabel: 'Aktualizuję...',
    icon: 'lucide:refresh-cw',
    action: realUpdate,
    isAvailable: () => !!getShopIdFromUrl(),
  },
  {
    id: 'deactivate',
    label: 'Deactivate and update',
    icon: 'lucide:power',
    action: deactivateAndUpdate,
  },
  {
    id: 'purge',
    label: 'Purge',
    loadingLabel: 'Purging...',
    icon: 'lucide:trash-2',
    action: purge,
    isAvailable: () => !!document.querySelector(ALIAS_TABLE_SELECTOR),
  },
];
