const formatPrice: Record<string, (price: string, options?: any) => string> = {
  toCommaDecimalWithSpaces: (price: string) => {
    const [integerPartRaw = '', decimalPartRaw = '00'] = String(price).split('.');
    const integerPart = integerPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const decimalPart = decimalPartRaw.padEnd(2, '0').slice(0, 2);

    return `${integerPart},${decimalPart}`;
  },
  DE: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  CHDE: (price: string, options?: any) => {
    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, "'").join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, "'").join('');
    }

    return price;
  },
  AT: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  FR: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, ' ').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, ' ').join('');
    }

    return price;
  },
  BE: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  IT: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  UK: (price: string, options?: any) => {
    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, ',').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, ',').join('');
    }

    return price;
  },
  ES: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  PT: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  PL: (price: string, options?: any) => {
    return formatPrice.toCommaDecimalWithSpaces(price);
  },
  HU: (price: string, options?: any) => {
    price = price.replace('.00', '');
    price = price.replace('.99', '');

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, ' ').toSpliced(5, 0, ' ').join('');
    }

    if (price.length === 6) {
      price = price.split('').toSpliced(3, 0, ' ').join('');
    }

    if (price.length === 5) {
      price = price.split('').toSpliced(2, 0, ' ').join('');
    }

    if (price.length === 4) {
      price = price.split('').toSpliced(1, 0, ' ').join('');
    }

    return price;
  },
  NL: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  SE: (price: string, options?: any) => {
    price = price.replace('.00', '');

    if (price.length === 5) {
      price = price.split('').toSpliced(2, 0, ' ').join('');
    }

    if (price.length === 4) {
      price = price.split('').toSpliced(1, 0, ' ').join('');
    }

    return price;
  },
  DK: (price: string, options?: any) => {
    price = price.replace('.00', '');

    if (price.length === 5) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 4) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  CZ: (price: string, options?: any) => {
    return formatPrice.toCommaDecimalWithSpaces(price);
  },
  FI: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, ' ').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, ' ').join('');
    }

    return price;
  },
  NO: (price: string, options?: any) => {
    price = price.replace('.00', '');

    if (price.length === 5) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 4) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
  SK: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, ' ').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, ' ').join('');
    }

    return price;
  },
  RO: (price: string, options?: any) => {
    const isThousands = price.length >= 7;

    if (price.endsWith('.00')) {
      price = isThousands ? price.replace('.00', '') : price.replace('.00', ',00');
    }

    if (price.endsWith('.99')) {
      price = price.replace('.99', ',99');
    }

    if (isThousands) {
      const parts = price.split(',');
      let integer = parts[0].replace(/\./g, '');

      integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

      price = parts.length > 1 ? `${integer},${parts[1]}` : integer;
    }

    return price;
  },

  HR: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },

  SI: (price: string, options?: any) => {
    price = price.replace('.00', ',00');
    price = price.replace('.99', ',99');

    if (price.length === 8) {
      price = price.split('').toSpliced(2, 0, '.').join('');
    }

    if (price.length === 7) {
      price = price.split('').toSpliced(1, 0, '.').join('');
    }

    return price;
  },
};

function normalize(price: string, country: string, options?: any): string {
  return formatPrice[country](price, options);
}

const currencies = {
  euro: '€',
  swissFranc: 'Fr.',
  poundSterling: '£',
  hungarianForint: 'Ft',
  swedishKrona: ':-',
  danishKrona: 'kr.',
  czechKrona: 'Kč',
  norwegianKrone: ',-',
  polandZloty: 'PLN',
  romanianLeu: 'lei',
};
const relativePriceFormat = {
  DE: {
    currency: currencies.euro,
  },
  CH: {
    currency: currencies.swissFranc,
  },
  AT: {
    currency: currencies.euro,
  },
  FR: {
    currency: currencies.euro,
  },
  BE: {
    currency: currencies.euro,
  },
  IT: {
    currency: currencies.euro,
  },
  UK: {
    currency: currencies.poundSterling,
  },
  ES: {
    currency: currencies.euro,
  },
  PT: {
    currency: currencies.euro,
  },
  PL: {
    currency: currencies.polandZloty,
  },
  HU: {
    currency: currencies.hungarianForint,
  },
  NL: {
    currency: currencies.euro,
  },
  SE: {
    currency: currencies.swedishKrona,
  },
  DK: {
    currency: currencies.danishKrona,
  },
  CZ: {
    currency: currencies.czechKrona,
  },
  FI: {
    currency: currencies.euro,
  },
  NO: {
    currency: currencies.norwegianKrone,
  },
  SK: {
    currency: currencies.euro,
  },
  RO: {
    currency: currencies.romanianLeu,
  },
  SI: {
    currency: currencies.euro,
  },
  HR: {
    currency: currencies.euro,
  },
};
export const priceFormats: Record<string, (price: string) => string> = {
  DE: (price: string) => {
    return normalize(price, 'DE') + ' ' + relativePriceFormat.DE.currency;
  },
  CHDE: (price: string) => {
    return normalize(price, 'CHDE') + ' ' + relativePriceFormat.CH.currency;
  },
  AT: (price: string) => {
    return normalize(price, 'AT') + ' ' + relativePriceFormat.AT.currency;
  },
  FR: (price: string) => {
    return normalize(price, 'FR') + ' ' + relativePriceFormat.FR.currency;
  },
  BE: (price: string) => {
    return normalize(price, 'BE') + ' ' + relativePriceFormat.BE.currency;
  },
  IT: (price: string) => {
    return normalize(price, 'IT') + ' ' + relativePriceFormat.IT.currency;
  },
  UK: (price: string) => {
    return relativePriceFormat.UK.currency + normalize(price, 'UK');
  },
  ES: (price: string) => {
    return normalize(price, 'ES') + ' ' + relativePriceFormat.ES.currency;
  },
  PT: (price: string) => {
    return normalize(price, 'PT') + ' ' + relativePriceFormat.PT.currency;
  },
  PL: (price: string) => {
    return normalize(price, 'PL') + ' ' + relativePriceFormat.PL.currency;
  },
  HU: (price: string) => {
    return normalize(price, 'HU') + ' ' + relativePriceFormat.HU.currency;
  },
  NL: (price: string) => {
    return relativePriceFormat.NL.currency + ' ' + normalize(price, 'NL');
  },
  SE: (price: string) => {
    return normalize(price, 'SE') + relativePriceFormat.SE.currency;
  },
  DK: (price: string) => {
    return normalize(price, 'DK') + ' ' + relativePriceFormat.DK.currency;
  },
  CZ: (price: string) => {
    return normalize(price, 'CZ') + ' ' + relativePriceFormat.CZ.currency;
  },
  FI: (price: string) => {
    return normalize(price, 'FI') + ' ' + relativePriceFormat.FI.currency;
  },
  NO: (price: string) => {
    return normalize(price, 'NO') + relativePriceFormat.NO.currency;
  },
  SK: (price: string) => {
    return normalize(price, 'SK') + ' ' + relativePriceFormat.SK.currency;
  },
  RO: (price: string) => {
    return normalize(price, 'RO') + ' ' + relativePriceFormat.RO.currency;
  },
  SI: (price: string) => {
    return normalize(price, 'SI') + ' ' + relativePriceFormat.SI.currency;
  },
  HR: (price: string) => {
    return normalize(price, 'HR') + ' ' + relativePriceFormat.HR.currency;
  },
};
