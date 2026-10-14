export type TimerTheme = {
  id: string;
  label: string;
  background: string;
  color: string;
  unitBackground: string;
  freebiesBackground: string;
  freebiesTextColor: string;
  freebiesLineColor: string;
  freebiesFreeColor: string;
};

export const TIMER_THEMES: TimerTheme[] = [
  {
    id: 'cozy-brown-white',
    label: 'Cozy Brown & White',
    background: '#6D0000',
    color: '#FFFFFF',
    unitBackground: '#A86A6A',
    freebiesBackground: '#FFFFFF',
    freebiesTextColor: '#000000',
    freebiesLineColor: '#ECE7E0',
    freebiesFreeColor: '#750000',
  },
  {
    id: 'cozy-brown',
    label: 'Cozy Brown',
    background: '#6D0000',
    color: '#FFFFFF',
    unitBackground: '#A86A6A',
    freebiesBackground: '#D6B3B3',
    freebiesTextColor: '#000000',
    freebiesLineColor: '#ECE7E0',
    freebiesFreeColor: '#750000',
  },
  {
    id: 'happy-red',
    label: 'Happy Red',
    background: '#FF2F00',
    color: '#FFFFFF',
    unitBackground: '#FF9780',
    freebiesBackground: '#FFC1B3',
    freebiesTextColor: '#000000',
    freebiesLineColor: '#ECE7E0',
    freebiesFreeColor: '#750000',
  },
  {
    id: 'warm-yellow',
    label: 'Warm Yellow',
    background: '#FD9000',
    color: '#000000',
    unitBackground: '#FECD8C',
    freebiesBackground: '#FECD8C',
    freebiesTextColor: '#000000',
    freebiesLineColor: '#ECE7E0',
    freebiesFreeColor: '#750000',
  },
  {
    id: 'subtle-peach',
    label: 'Subtle Peach',
    background: '#F6E7E6',
    color: '#000000',
    unitBackground: '#E3CCCC',
    freebiesBackground: '#F8F2F2',
    freebiesTextColor: '#000000',
    freebiesLineColor: '#E3CCCC',
    freebiesFreeColor: '#750000',
  },
  {
    id: 'soft-peach',
    label: 'Soft Peach',
    background: '#FFCCB7',
    color: '#000000',
    unitBackground: '#FFE6DB',
    freebiesBackground: '#FFE6DB',
    freebiesTextColor: '#000000',
    freebiesLineColor: '#E3CCCC',
    freebiesFreeColor: '#750000',
  },
];

export const DEFAULT_THEME_ID = 'subtle-peach';

export const getTheme = (id: string | undefined): TimerTheme =>
  TIMER_THEMES.find(theme => theme.id === id) ?? TIMER_THEMES.find(theme => theme.id === DEFAULT_THEME_ID)!;
