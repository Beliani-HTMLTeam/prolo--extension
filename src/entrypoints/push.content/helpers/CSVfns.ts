/**
 * Parses a delimited string into an array of arrays. Default delimiter is
 * the comma, override with the second argument.
 */
export function CSVToArray(strData: string, strDelimiter: string = ','): string[][] {
  const objPattern = new RegExp(
    // Delimiters.
    '(\\' +
      strDelimiter +
      '|\\r?\\n|\\r|^)' +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      strDelimiter +
      '\\r\\n]*))',
    'gi'
  );

  const arrData: string[][] = [[]];
  let arrMatches: RegExpExecArray | null = null;

  while ((arrMatches = objPattern.exec(strData))) {
    const strMatchedDelimiter = arrMatches[1];

    // A delimiter that isn't the field delimiter means we've hit a new row.
    if (strMatchedDelimiter.length && strMatchedDelimiter !== strDelimiter) {
      arrData.push([]);
    }

    let strMatchedValue: string;
    if (arrMatches[2]) {
      // Quoted value — unescape doubled quotes.
      strMatchedValue = arrMatches[2].replace(/""/g, '"');
    } else {
      // Unquoted value.
      strMatchedValue = arrMatches[3];
    }

    arrData[arrData.length - 1].push(strMatchedValue);
  }

  return arrData;
}

export interface CampaignBanner {
  src: string;
  href: string;
  timer_url: string;
  timer_bg: string;
  timer_color: string;
  hasTimer: boolean;
  freebie: string;
  last?: boolean;
}

/** Merges up to 6 banner/timer column sets from one CSV row into a loopable array (Banner_N, Timer_N). */
function processCampaignsFromCSV(csvRow: string[], headers: string[]): { campaigns: CampaignBanner[] } {
  const campaigns: CampaignBanner[] = [];

  for (let i = 1; i <= 6; i++) {
    const srcCol = headers.indexOf(`Banner_${i}_src`);
    const hrefCol = headers.indexOf(`Banner_${i}_href`);

    const timerCol = headers.indexOf(`Timer_${i}`);
    const timerSrcCol = headers.indexOf(`Timer_${i}_src`);
    const timerFreebieCol = headers.indexOf(`Timer_${i}_freebie`);
    const timerBgCol = headers.indexOf(`Timer_${i}_bg`);
    const timerColorCol = headers.indexOf(`Timer_${i}_color`);

    if (srcCol !== -1 && csvRow[srcCol]) {
      const timerUrl = (timerCol !== -1 ? csvRow[timerCol] : '') || (timerSrcCol !== -1 ? csvRow[timerSrcCol] : '');

      const freebie = timerFreebieCol !== -1 ? csvRow[timerFreebieCol] : '';

      campaigns.push({
        src: csvRow[srcCol],
        href: csvRow[hrefCol] || '',
        timer_url: timerUrl,
        timer_bg: timerBgCol !== -1 ? csvRow[timerBgCol] : '#750000',
        timer_color: timerColorCol !== -1 ? csvRow[timerColorCol] : '#FFFFFF',
        hasTimer: !!timerUrl,
        freebie,
      });
    }
  }

  // Mark the last campaign so the template can drop trailing spacing.
  if (campaigns.length > 0) {
    campaigns[campaigns.length - 1].last = true;
  }

  return { campaigns };
}

export interface TemplateData {
  [key: string]: unknown;
  campaigns: CampaignBanner[];
}

export function csvRowToTemplateData(csvRow: string[], headers: string[]): TemplateData {
  const data: Record<string, unknown> = {};

  headers.forEach((header, index) => {
    if (csvRow[index] !== undefined && csvRow[index] !== '') {
      data[header] = csvRow[index];
    }
  });

  const { campaigns } = processCampaignsFromCSV(csvRow, headers);
  data.campaigns = campaigns;

  campaigns.forEach((campaign, index) => {
    const num = index + 1;
    data[`Banner_${num}_src`] = campaign.src;
    data[`Banner_${num}_href`] = campaign.href;
    data[`Timer_${num}_src`] = campaign.timer_url;
    data[`Timer_${num}_bg`] = campaign.timer_bg;
    data[`Timer_${num}_color`] = campaign.timer_color;
    data[`Timer_${num}_freebie`] = campaign.freebie;
  });

  return data as TemplateData;
}

/** Character-by-character CSV parser (alternate to CSVToArray — kept for parity with the original file). */
export function parseCSV2(str: string): string[][] {
  const arr: string[][] = [];
  let quote = false; // true means we're inside a quoted field

  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    const cc = str[c];
    const nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';

    // Escaped quote inside a quoted field.
    if (cc === '"' && quote && nc === '"') {
      arr[row][col] += cc;
      ++c;
      continue;
    }

    // Begin/end quoted field.
    if (cc === '"') {
      quote = !quote;
      continue;
    }

    // Field separator.
    if (cc === ',' && !quote) {
      ++col;
      continue;
    }

    // CRLF row separator.
    if (cc === '\r' && nc === '\n' && !quote) {
      ++row;
      col = 0;
      ++c;
      continue;
    }

    // LF row separator.
    if (cc === '\n' && !quote) {
      ++row;
      col = 0;
      continue;
    }

    // Lone CR row separator.
    if (cc === '\r' && !quote) {
      ++row;
      col = 0;
      continue;
    }

    arr[row][col] += cc;
  }

  return arr;
}

/**
 * Takes the full CSVToArray output (header row + data rows) and returns a map
 * keyed by the lowercased first column of each row, where each value is an
 * object of { lowercased header: cell value }.
 */
export function parseCSV(csv: string[][]): Record<string, Record<string, string>> {
  const [cols] = csv;
  const parsedCSV: Record<string, Record<string, string>> = {};

  for (let index = 1; index < csv.length; index++) {
    const arr = csv[index];
    const obj: Record<string, string> = {};

    for (let i = 0; i < arr.length; i++) {
      obj[cols[i].toLowerCase()] = arr[i];
    }

    parsedCSV[arr[0].toLowerCase()] = obj;
  }

  return parsedCSV;
}