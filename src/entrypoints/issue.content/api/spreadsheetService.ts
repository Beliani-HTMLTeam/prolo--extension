const ZROK_BASE = 'https://tj31c889tzsk.share.zrok.io/api/sheets/';

const refreshCache = new Map<string, { timestamp: number; data: any }>();

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds
interface PurgeResult {
  success: boolean;
  year?: string;
  tabName?: string;
  error?: string;
}

export const purgeDynamicSpreadsheetData = async (
  year: string,
  tabName: string
): Promise<PurgeResult> => {
  const url = `${ZROK_BASE}dynamic/${year}/${tabName}/force-refresh`;

  try {
    console.log(`Purging dynamic spreadsheet...\nYear: ${year}\nTab: ${tabName}`);

    const headers = {
      Accept: 'application/json',
      skip_zrok_interstitial: 'true',
    };

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
    });

    if (response.ok) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Successfully purged dynamic spreadsheet!\nYear: ${year}\nTab: ${tabName}`);
      return { success: true, year, tabName };
    } else {
      console.error(`Failed to purge (${response.status}):\nYear: ${year}\nTab: ${tabName}`);
      return { 
        success: false, 
        year, 
        tabName, 
        error: `Failed to purge (${response.status})` 
      };
    }
  } catch (error: any) {
    console.error('Purge error: ', error);
    return { 
      success: false, 
      year, 
      tabName, 
      error: error.message 
    };
  }
};

export const refreshSpreadsheetData = async (
  issueItem: any,
  issueId: number,
  onDataLoaded?: (data: any) => void
): Promise<boolean> => {
  try {
    // Check if we already refreshed recently
    const cacheKey = `spreadsheet_${issueId}`;
    const cached = refreshCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('Using cached spreadsheet data (refreshed recently)');
      if (onDataLoaded && cached.data) {
        onDataLoaded(cached.data);
      }
      return true;
    }

    // Get the spreadsheet info from the issue item
    const nsltFields = issueItem.additional_fields?.['Newsletter production'];
    const spreadsheetField = nsltFields?.find((f: any) => f.name === 'Translation spreadsheet newsletter');
    
    if (!spreadsheetField?.value) {
      console.warn('No spreadsheet field found');
      return false;
    }

    // Extract spreadsheet ID and GID from URL
    const url = spreadsheetField.value;
    const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const queryGidMatch = url.match(/[?&]gid=([^&#]+)/);
    const hashGidMatch = url.match(/#gid=([^&]+)/);
    const spreadsheetId = idMatch?.[1];
    const gid = queryGidMatch?.[1] ?? hashGidMatch?.[1];
    
    if (!spreadsheetId || !gid) {
      console.warn('Could not extract spreadsheet ID or GID');
      return false;
    }

    // Resolve tab name
    const tabRes = await fetch(`${ZROK_BASE}misc/resolveTabName/${spreadsheetId}/${gid}`, {
      headers: {
        Accept: 'application/json',
        skip_zrok_interstitial: 'true',
      },
      mode: 'cors',
      credentials: 'omit',
    });
    const tabJson = await tabRes.json();
    
    if (tabJson?.code !== 200 || !tabJson?.year || !tabJson?.tab) {
      console.warn('Could not resolve tab name');
      return false;
    }

    // Purge the cache
    const purgeResult = await purgeDynamicSpreadsheetData(tabJson.year, tabJson.tab);
    
    if (!purgeResult.success) {
      console.warn('Purge failed, but continuing...');
    }

    // Fetch fresh data
    const dynRes = await fetch(`${ZROK_BASE}dynamic/${tabJson.year}/${tabJson.tab}`, {
      headers: {
        Accept: 'application/json',
        skip_zrok_interstitial: 'true',
      },
      mode: 'cors',
      credentials: 'omit',
    });
    const dynJson = await dynRes.json();
    
    if (dynJson?.code !== 200) {
      console.warn('Failed to fetch fresh data');
      return false;
    }

    // Cache the result
    refreshCache.set(cacheKey, {
      timestamp: Date.now(),
      data: dynJson,
    });

    if (onDataLoaded) {
      onDataLoaded(dynJson);
    }

    return true;
  } catch (error) {
    console.error('Failed to refresh spreadsheet data:', error);
    return false;
  }
};
