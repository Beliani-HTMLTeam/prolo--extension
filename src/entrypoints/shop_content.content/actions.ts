import { config } from '@/config/prolo';
import { shopLanguageMap } from './types/types';

export const ALIAS_TABLE_SELECTOR = '#aliasForURL';

const LANGUAGE_UPDATE_DELAY_MS = 3000;
const MAIN_UPDATE_SETTLE_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function getShopIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('shop_id');
}

function clickLanguageButtons(shopId: string): void {
  const languages = shopLanguageMap[shopId];
  if (!languages) return;

  console.log(`Clicking language buttons for shop_id=${shopId}: ${languages.join(', ')}`);

  languages.forEach(language => {
    const buttons = document.querySelectorAll<HTMLInputElement>(
      `input[type="button"][onclick*="updateHtml(this, '${language}'"][value="Update"]`,
    );

    if (buttons.length === 0) {
      console.log(`Update button not found for language: ${language}`);
    }

    buttons.forEach(button => {
      console.log(`Clicked update button for language: ${language}`);
      button.click();
    });
  });
}

function clickMainUpdateButton(): void {
  const [mainButton] = document.querySelectorAll<HTMLInputElement>('input.update-btn[type="button"][value="Update"]');

  if (mainButton) {
    console.log('Clicking main Update button');
    mainButton.click();
  } else {
    console.log('Main Update button not found');
  }
}

export async function realUpdate() {
  const shopId = getShopIdFromUrl();
  if (!shopId) return;

  clickLanguageButtons(shopId);
  await sleep(LANGUAGE_UPDATE_DELAY_MS);
  clickMainUpdateButton();
  await sleep(MAIN_UPDATE_SETTLE_MS);
}

export function deactivateAndUpdate() {
  document.querySelector<HTMLInputElement>('input#activate-button[type="submit"]')?.click();
}

function collectPurgeTargets(): Record<string, string[]> {
  const pathsByDomain: Record<string, string[]> = {};
  const anchors = document.querySelectorAll<HTMLAnchorElement>(`${ALIAS_TABLE_SELECTOR} a`);

  anchors.forEach(alias => {
    if (alias.href.includes('prologistics')) return;
    const { hostname, pathname } = new URL(alias.href);
    const domain = hostname.replace('www.', '');
    const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
    (pathsByDomain[domain] ??= []).push(path);
  });

  return pathsByDomain;
}

async function purgeDomain(domain: string, paths: string[]): Promise<void> {
  const formData = new FormData();
  formData.append('domain', domain);
  formData.append('prio', '1');
  formData.append('urls', paths.join('\n'));
  formData.append('purge', 'Purge');

  try {
    await fetch(`${window.location.origin}${config.paths.purge}`, { method: 'POST', body: formData });
  } catch (err) {
    console.error(`Error while purging ${domain}:`, err);
  }
}

export async function purge() {
  const targets = collectPurgeTargets();
  const count = Object.values(targets).reduce((sum, paths) => sum + paths.length, 0);

  if (count === 0) {
    console.log('No URLs found to purge');
    return;
  }

  for (const [domain, paths] of Object.entries(targets)) {
    await purgeDomain(domain, paths);
  }

  alert(`Purge completed! (urls: ${count})`);
}
