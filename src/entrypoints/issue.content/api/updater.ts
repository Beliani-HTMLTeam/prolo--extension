import { IssueListItem } from "../lib/types";
import { fetchSpreadsheetTranslationsTab } from "./issueData";

export const fetchLPPaths = async (issueItem: IssueListItem): Promise<string> => {
  const tabName = await fetchSpreadsheetTranslationsTab(issueItem); // "22.05.26 - Beds" format

  if (!tabName){
        console.warn('No tab name found, using default LP');

    return 'lp00-00-00'};

  let year: string, month: string, day: string;

  let dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{2})/); // DD.MM.YY format
  if (dateMatch) {
    // format: DD.MM.YY
    [, day, month, year] = dateMatch;
  } else {
    // DD.MM.YYYY format
    dateMatch = tabName.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (dateMatch) {
      [, day, month, year] = dateMatch;
      year = year.slice(-2);
    } else {
            console.warn('Could not parse date from tab name:', tabName);
      return 'lp00-00-00';
    }
  }

  const result = `lp${year}-${month}-${day}`;
  console.log('Generated LP path:', result);
  return result;
};