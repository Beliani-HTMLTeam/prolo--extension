import { setupPurge } from "./purge";

export default defineContentScript({
  matches: ['*://*.prologistics.info/purge.php*'],
  main() {
    setupPurge();
  },
});