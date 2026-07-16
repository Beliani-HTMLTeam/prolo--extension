export const languages = [
  'english',
  'polish',
  'germanDE',
  'german',
  'dutch',
  'french',
  'spanish',
  'portugal',
  'italian',
  'danish',
  'norsk',
  'finnish',
  'swedish',
  'czech',
  'slovak',
  'Hungarian',
  'romanian',
  'slovene',
  'croatian',
] as const;

export type Language = (typeof languages)[number];

export interface CountryConfig {
  slug: string;
  language: Language;
}

export const countryConfigs: CountryConfig[] = [
  { slug: 'UK', language: 'english' },
  { slug: 'PL', language: 'polish' },
  { slug: 'DE', language: 'germanDE' },
  { slug: 'AT', language: 'germanDE' },
  { slug: 'CHDE', language: 'german' },
  { slug: 'NL', language: 'dutch' },
  { slug: 'FR', language: 'french' },
  { slug: 'CHFR', language: 'french' },
  { slug: 'ES', language: 'spanish' },
  { slug: 'PT', language: 'portugal' },
  { slug: 'IT', language: 'italian' },
  { slug: 'DK', language: 'danish' },
  { slug: 'NO', language: 'norsk' },
  { slug: 'FI', language: 'finnish' },
  { slug: 'SE', language: 'swedish' },
  { slug: 'CZ', language: 'czech' },
  { slug: 'SK', language: 'slovak' },
  { slug: 'HU', language: 'Hungarian' },
  { slug: 'BEFR', language: 'french' },
  { slug: 'BENL', language: 'dutch' },
  { slug: 'RO', language: 'romanian' },
  { slug: 'CHIT', language: 'italian' },
  { slug: 'SI', language: 'slovene' },
  { slug: 'HR', language: 'croatian' },
];
