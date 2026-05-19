import { IssueListItem } from '../lib/types';
import { fetchSpreadsheetTranslationsTab } from './issueData';

interface LPPathResult {
  lp :string;
  date: Date | null;
}

export const fetchLPPaths = async (issueItem: IssueListItem): Promise<LPPathResult> => {
  const tabName = await fetchSpreadsheetTranslationsTab(issueItem); // "22.05.26 - Beds" format

  if (!tabName) {
    console.warn('No tab name found, using default LP');
    return { lp: 'lp00-00-00', date: null };
  }

  let year: string, month: string, day: string;
  let parsedDate: Date | null = null;

  let dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{2})/); // DD.MM.YY format
  if (dateMatch) {
    // format: DD.MM.YY
    [, day, month, year] = dateMatch;
        parsedDate = new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // DD.MM.YYYY format
    dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      [, day, month, year] = dateMatch;
      const fullYear = year;
      year = year.slice(-2);
            parsedDate = new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));

    } else {
      console.warn('Could not parse date from tab name:', tabName);
      return { lp: 'lp00-00-00', date: null };
    }
  }

    if (parsedDate && isNaN(parsedDate.getTime())) {
    console.warn('Invalid date parsed from tab name:', tabName);
    parsedDate = null;
  }

  const result = `lp${year}-${month}-${day}`;
  console.log('Generated LP path:', result);
  return { lp: result, date: parsedDate };
};
