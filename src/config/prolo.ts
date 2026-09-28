export const config = {
  prologisticsDevHost: 'https://prolodev.prologistics.info',
  prologisticsProdHost: 'https://www.prologistics.info',

  // zrokOrigin: 'https://tj31c889tzsk.share.zrok.io',
  zrokOrigin: 'http://localhost:3001',
  get zrokBase() {
    // return `${this.zrokOrigin}/api/sheets`;
    return `${this.zrokOrigin}`;
  },
  zrokHeaders: {
    Accept: 'application/json',
    skip_zrok_interstitial: 'true',
  } as Record<string, string>,
};
