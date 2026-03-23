export const mentionToShopsMap: Record<string, string[]> = {
  '@Content Team(3703)': ['UK', 'PL'],
  '@DACH translation(4487)': ['AT', 'CHDE', 'DE'],
  '@FR translation(4489)': ['BEFR', 'CHFR', 'FR'],
  '@NL translation(4488)': ['BENL', 'NL'],
  '@CZ translation(4497)': ['CZ'],
  '@DK translation(4495)': ['DK'],
  '@ES translation(4491)': ['ES'],
  '@FI translation(4493)': ['FI'],
  '@HU translation(4499)': ['HU'],
  '@IT translation(4490)': ['IT', 'CHIT'],
  '@NO translation(4496)': ['NO'],
  '@PT translation(4492)': ['PT'],
  '@RO translation(4688)': ['RO'],
  '@SE translation(4494)': ['SE'],
  '@SK translation(4498)': ['SK'],
};

export const shopToMentionTagMap: Record<string, string> = {};

for (const mentionTag in mentionToShopsMap) {
  for (const shop of mentionToShopsMap[mentionTag]) {
    shopToMentionTagMap[shop] = mentionTag;
  }
}
