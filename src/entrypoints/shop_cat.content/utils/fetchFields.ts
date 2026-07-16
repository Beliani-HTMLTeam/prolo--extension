import { countryConfigs } from './settings';

export function fetchCategories(type: 'alias' | 'name'): string {
  // prettier-ignore
  const expectedKeys = ["uk", "pl", "de", "at", "chde", "nl", "fr", "chfr", "es", "pt", "it", "dk", "no", "fi", "se", "cz", "sk", "hu", "befr", "benl", "ro", "chit", "si", "hr" ];

  const result: any[] = [];
  const sheetColumn: string[] = [];

  countryConfigs.forEach((config, index) => {
    const selector = `[name='${type}[${config.language}]']`;
    const element = document.querySelector<HTMLInputElement>(selector);
    const category = element?.value ?? 'TRANSLATION NOT FOUND';
    const expected = expectedKeys[index];
    const match = config.slug.toLowerCase() === expected?.toLowerCase() ? '✅' : '❌';

    result.push({ order: index + 1, slug: config.slug, expected, match, category });
    sheetColumn.push(category);
  });

  console.table(result);

  console.log('%ccopy this to global translations:', 'color: #4CAF50; font-weight: bold;');
  const joinedResult = sheetColumn.join('\n');
  console.log(joinedResult);

  return joinedResult;
}
