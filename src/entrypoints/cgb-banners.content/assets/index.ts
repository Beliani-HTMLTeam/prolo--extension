import Swal from 'sweetalert2';
import nyanCat from '../img/cat.gif';
import cryMen from '../img/crying-26.gif';
import { config } from '@/config/prolo';
import { SHOP_ID_TO_CODE, COUNTRY_CASHBACK, invertRecord } from '@/config/shopMaps';

export const dev: string = config.prologisticsDevHost;
export const prod: string = config.prologisticsProdHost;
export const bannerDEV: string = `${dev}/shop_banner.php`;
export const mainURL: string = `${dev}/shop_banners.php`;
export const mainURLprod: string = `${prod}/shop_banners.php`;
export const bannerPROD: string = `${prod}/shop_banner.php`;
export const shopDev: string = 'https://www.dev.beliani.net/';
export const shopProd: string = 'https://www.beliani.co.uk/';

type CountryCode = 
  | 'english' | 'polish' | 'german' | 'germanDE' | 'dutch' | 'french' 
  | 'spanish' | 'portugal' | 'italian' | 'danish' | 'norsk' | 'finnish' 
  | 'swedish' | 'czech' | 'slovak' | 'Hungarian' | 'romanian' | 'slovene' 
  | 'croatian'   | ''; 

type ShopKey = 'UK' | 'PL' | 'DACH' | 'AT' | 'DE' | 'CH' | 'NL' | 'FR' | 'ES' | 'PT' | 'IT' | 'DK' | 'NO' | 'FI' | 'SE' | 'CZ' | 'SK' | 'HU' | 'RO' | 'HR' | 'SI' | 'BE';

type StatusType = 'success' | 'error' | 'nyan' | 'cryMen';

interface FileItem {
  name: string;
}

interface ButtonElement extends HTMLInputElement {
  name: string;
  files: FileList | null;
}

interface ShopIdMap {
  [key: string]: ShopKey;
}

interface SlugMap {
  [key: string]: string | string[];
}

interface CountryCodeMap {
  [key: string]: CountryCode | CountryCode[];
}

export const langSlugDesktop: Record<string, string> = {
  'offer_text[czech]': 'cz',
  'offer_text[danish]': 'dk',
  'offer_text[dutch]': 'nl',
  'offer_text[english]': 'uk',
  'offer_text[finnish]': 'fi',
  'offer_text[french]': 'fr',
  'offer_text[german]': 'chde',
  'offer_text[germanDE]': 'deat',
  'offer_text[Hungarian]': 'hu',
  'offer_text[italian]': 'it',
  'offer_text[norsk]': 'no',
  'offer_text[polish]': 'pl',
  'offer_text[portugal]': 'pt',
  'offer_text[romanian]': 'ro',
  'offer_text[slovak]': 'sk',
  'offer_text[spanish]': 'es',
  'offer_text[swedish]': 'se',
  'offer_text[croatian]': 'hr',
  'offer_text[slovene]': 'si',
};

export const COUNTRY_CODE: CountryCodeMap = {
  UK: 'english',
  PL: 'polish',
  DACH: ['german', 'germanDE'],
  CH: 'german',
  CHDE: 'german',
  DE: 'germanDE',
  AT: 'germanDE',
  DEAT: 'germanDE',
  NL: 'dutch',
  FR: 'french',
  ES: 'spanish',
  PT: 'portugal',
  IT: 'italian',
  DK: 'danish',
  NO: 'norsk',
  FI: 'finnish',
  SE: 'swedish',
  CZ: 'czech',
  SK: 'slovak',
  HU: 'Hungarian',
  RO: 'romanian',
  BEN: '',
  SI: 'slovene',
  HR: 'croatian',
};

const CODE_TO_SHOP_ID: Record<string, string> = invertRecord(SHOP_ID_TO_CODE);

export const SLUG_SHOP: SlugMap = {
  ...Object.fromEntries(Object.entries(CODE_TO_SHOP_ID).map(([code, id]) => [code, `?shop_id=${id}`])),
  DACH: ['?shop_id=1', '?shop_id=3', '?shop_id=8'],
};

export function convertToObject(CSV: string[][]): Record<string, string> {
  const [header, ...rows] = CSV;
  const slugIndex = header.indexOf('slug');
  const textIndex = header.indexOf('discount_banner_text');

  if (slugIndex === -1 || textIndex === -1) {
    Swal.fire({
      icon: 'error',
      title: '(；⌣̀_⌣́)',
      text: `Looks like the file is wrong. Check CSV file.`,
      showConfirmButton: true,
    });
  }

  const object_data: Record<string, string> = {};

  for (const row of rows) {
    const slug = row[slugIndex];
    const text = row[textIndex];

    if (!slug || !text) continue;

    object_data[slug] = text;
  }

  return object_data;
}

export const getModal = (status: StatusType, text: string): void => {
  switch (status) {
    case 'success':
      Swal.fire({
        icon: 'success',
        title: 'File uploaded',
        html: text || '',
        timer: 2000,
        showConfirmButton: false,
      });
      break;

    case 'error':
      Swal.fire({
        icon: 'error',
        title: '(」°ロ°)」',
        text: text,
        showConfirmButton: true,
      });
      break;

    case 'nyan':
      Swal.fire({
        icon: 'success',
        html: `
        <h2>${text}</h2>
        <img src=${nyanCat} alt="success" style="width:200px;" />`,
        timer: 3000,
        showConfirmButton: false,
      });
      break;

    case 'cryMen':
      Swal.fire({
        icon: 'error',
        html: `
        <h2>${text}</h2>
        <img src=${cryMen} alt="success" style="width:400px;" />`,
        showConfirmButton: true,
      });
      break;
  }
};

export const getCurrentShop = (): ShopKey | undefined => {
  const shopIdMap: ShopIdMap = SHOP_ID_TO_CODE as ShopIdMap;

  const params = new URLSearchParams(window.location.search);
  const shopId = params.get('shop_id');

  return shopId ? shopIdMap[shopId] : undefined;
};

export const checkedDeviceType = (item: FileItem, 
  device: string, 
  btnArray: ButtonElement[]) : void=> {
  if (!item?.name || !device) return;
  const fileNameUpper = item.name.toUpperCase();
  const deviceUpper = device.toUpperCase();

  if (!fileNameUpper.includes(`_${deviceUpper}`)) return;

  console.log('checkedDeviceType', item.name, device, btnArray);

  const splitedName = item.name.split(new RegExp(`_${device}`, 'i'))[0];
  const language = COUNTRY_CODE[splitedName.toUpperCase()];

  if (!language) {
    console.warn(`No language mapping in COUNTRY_CODE for slug: ${splitedName}`);
    return;
  }

  const languages = Array.isArray(language) ? language : [language];

  languages.forEach(lang => {
    if (!lang) return;
    
    // Find all matching buttons for this language
    const matchingButtons = btnArray.filter(btn => {
      const btnLanguage = btn.name.split('[')[1].split(']')[0];
      return btnLanguage.toLowerCase() === lang.toLowerCase();
    });

    // If there are 2 or more matches, use the second one (index 1)
    // If there's only 1 match, use the first one (index 0)
    const button = matchingButtons.length >= 2 ? matchingButtons[1] : matchingButtons[0];

    console.log(`${lang}, matchingButtons:`, matchingButtons, 'selected button:', button);

    if (button) {
      const transferData = new DataTransfer();
      transferData.items.add(item as File);
      button.files = transferData.files;
      console.log("button.files", button.name, button.files)
      console.log(`✅ Assigned ${item.name} → ${button.name}`);
    } else {
      console.warn(`No button found for language: ${lang}`);
    }
  });
};

export const filledCashback = ( item: FileItem, 
  btnArray: ButtonElement[], 
  currentShop: ShopKey | undefined) => {
  const devices: Record<string, string> = {
    pic: 'DESKTOP',
    mobile_pic: 'MOBILE',
  };

  console.log('currentShop', currentShop, item, btnArray);

  const fileKey = item.name
    .replace(/\.[^/.]+$/, '')
    .trim()
    .toUpperCase();

  const fileKeyParts = fileKey.split('_');
  const slugParts = fileKeyParts.filter(part => isNaN(Number(part)) && part !== 'DESKTOP' && part !== 'MOBILE');
  const fileSlug = slugParts[0];
  const deviceType = fileKeyParts.find(part => part === 'DESKTOP' || part === 'MOBILE');
  const updatedFileKey = slugParts.join('-');

  let targetShops: string[] = [fileSlug];

  if (fileSlug === 'DEAT') {
    targetShops = ['DE', 'AT'];
  }

  for (const targetShop of targetShops) {
    const language = COUNTRY_CASHBACK[updatedFileKey];

    if (!language) {
      console.log('No language mapping for:', updatedFileKey);
      continue;
    }

    if (language === 'english') {
      let shopPrefix = updatedFileKey.split('-EN')[0];

      if (shopPrefix === 'DEAT' && currentShop === 'DE') {
        shopPrefix = 'DE';
      } else if (shopPrefix === 'DEAT' && currentShop === 'AT') {
        shopPrefix = 'AT';
      }

      if (shopPrefix !== currentShop && updatedFileKey.includes('-EN')) {
        return;
      }
    }
    const languages = Array.isArray(language) ? language : [language];

    languages.forEach(lang => {
      const input = btnArray.find(btn => {
        const btnLanguage = btn.name.match(/\[(.*?)\]/)?.[1];
        const btnType = btn.name.split('[')[0].trim().toLowerCase();
        const btnDeviceType = devices[btnType];
        if (!btnLanguage || !btnDeviceType) return false;

        return btnLanguage === lang && btnDeviceType === deviceType && targetShop === currentShop;
      });

      if (input) {
        console.log(`Assigning ${item.name} → shop: ${targetShop}, lang: ${lang}, device: ${deviceType}`);
        const transferData = new DataTransfer();
        transferData.items.add(item as File);
        input.files = transferData.files;
      }
    });
  }
};
