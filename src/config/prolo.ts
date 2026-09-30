export const config = {
  prologisticsDevHost: 'https://prolodev.prologistics.info',
  prologisticsProdHost: 'https://www.prologistics.info',

  zrokOrigin: 'https://tj31c889tzsk.share.zrok.io',
  // zrokOrigin: 'http://localhost:3001',
  get zrokBase() {
    return `${this.zrokOrigin}/api/sheets`;
    // return `${this.zrokOrigin}`;
  },
  zrokHeaders: {
    Accept: 'application/json',
    skip_zrok_interstitial: 'true',
  } as Record<string, string>,

  // Admin-site paths, same on dev/prod - combine with window.location.origin
  // so links/requests stay on whichever host the user is currently on.
  paths: {
    purge: '/purge.php',
    newsEmail: '/news_email.php',
    shopContent: '/shop_content.php',
    spamPlan: '/spam_plan.php',
    issueLogList: '/api/issueLog/list/',
  },
};
