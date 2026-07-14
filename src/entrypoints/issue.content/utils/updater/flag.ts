export const FLAG_URLS: Record<string, string> = {
  UK: 'https://pictureserver.net/static/flags/flag_uk.svg',
  PL: 'https://pictureserver.net/static/flags/flag_pl.svg',
  DE: 'https://pictureserver.net/static/flags/flag_de.svg',
  AT: 'https://pictureserver.net/static/flags/flag_at.svg',
  CHDE: 'https://pictureserver.net/static/flags/flag_ch.svg',
  CHFR: 'https://pictureserver.net/static/flags/flag_ch.svg',
  CHIT: 'https://pictureserver.net/static/flags/flag_ch.svg',
  NL: 'https://pictureserver.net/static/flags/flag_nl.svg',
  FR: 'https://pictureserver.net/static/flags/flag_fr.svg',
  ES: 'https://pictureserver.net/static/flags/flag_es.svg',
  PT: 'https://pictureserver.net/static/flags/flag_pt.svg',
  IT: 'https://pictureserver.net/static/flags/flag_it.svg',
  DK: 'https://pictureserver.net/static/flags/flag_dk.svg',
  NO: 'https://pictureserver.net/static/flags/flag_no.svg',
  FI: 'https://pictureserver.net/static/flags/flag_fi.svg',
  SE: 'https://pictureserver.net/static/flags/flag_se.svg',
  CZ: 'https://pictureserver.net/static/flags/flag_cz.svg',
  SK: 'https://pictureserver.net/static/flags/flag_sk.svg',
  HU: 'https://pictureserver.net/static/flags/flag_hu.svg',
  BEFR: 'https://pictureserver.net/static/flags/flag_be.svg',
  BENL: 'https://pictureserver.net/static/flags/flag_be.svg',
  RO: 'https://pictureserver.net/static/flags/flag_ro.svg',
  HR: 'https://pictureserver.net/static/flags/flag_hr.svg',
  SI: 'https://pictureserver.net/static/flags/flag_si.svg',
};

export const getFlagUrl = (slug: string): string | null => {
  return FLAG_URLS[slug] || null;
};