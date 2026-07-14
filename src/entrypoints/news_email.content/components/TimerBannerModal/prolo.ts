import { SHOP_SLUGS } from '../../constants/shops';

export const timezones: Record<string, string> = {
  chde: 'Europe/Zurich',
  chfr: 'Europe/Zurich',
  fr: 'Europe/Paris',
  de: 'Europe/Berlin',
  uk: 'Europe/London',
  at: 'Europe/Vienna',
  es: 'Europe/Madrid',
  pl: 'Europe/Warsaw',
  nl: 'Europe/Amsterdam',
  pt: 'Europe/Lisbon',
  it: 'Europe/Rome',
  se: 'Europe/Stockholm',
  hu: 'Europe/Budapest',
  dk: 'Europe/Copenhagen',
  cz: 'Europe/Prague',
  fi: 'Europe/Helsinki',
  no: 'Europe/Oslo',
  sk: 'Europe/Bratislava',
  benl: 'Europe/Brussels',
  befr: 'Europe/Brussels',
  ro: 'Europe/Bucharest',
};

export const LANG_MAP: Record<string, string> = {
  uk: 'english',
  de: 'german',
  fr: 'french',
  chde: 'german',
  chfr: 'french',
  pl: 'polish',
  it: 'italian',
  es: 'spanish',
  pt: 'portugal',
  nl: 'dutch',
  se: 'swedish',
  dk: 'danish',
  no: 'norwegian',
  fi: 'finnish',
  cz: 'czech',
  sk: 'slovak',
  hu: 'hungarian',
  ro: 'romanian',
  at: 'german',
  benl: 'dutch',
  befr: 'french',
};

export const generateProloUrls = (deadline: string, bg: string, color: string, background: string) => {
  const base = 'https://prologistics.info/timer.gif';
  const cleanBg = bg.replace('#', '');
  const cleanColor = color.replace('#', '');
  const cleanBackground = background.replace('#', '');

  return SHOP_SLUGS.map(slug => {
    const tz = timezones[slug];
    const lang = LANG_MAP[slug];
    return `${base}?deadline=${deadline}T23:59:00&timezone=${tz}&lang=${lang}&bg=${cleanBg}&color=${cleanColor}&label=${cleanColor}&background=${cleanBackground}`;
  });
};
