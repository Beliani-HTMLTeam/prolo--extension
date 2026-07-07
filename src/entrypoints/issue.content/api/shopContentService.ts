import { ActivationResult } from '@/entrypoints/newtab/types/Updater';
import axios from 'axios';
import pLimit from 'p-limit';

const limit = pLimit(5);

interface ActivationItem {
  lpId: string;
  shopId: string;
  slug: string;
  landingPage: string;
  activateDate: { date: string; time: string };
  deactivateDate: { date: string; time: string };
  newsletterTemplateId: string;
  pairedNewsletterMap?: Record<string, string>;
}

// Helper to get the correct newsletter template ID for paired shops
const getNewsletterTemplateId = (
  slug: string, 
  newsletterTemplateId: string,
  newsletterIds?: Record<string, { aId?: string; bId?: string }>
): string => {
  // If it's CHFR, use CHDE's newsletter ID
  if (slug === 'CHFR') {
    const chdeNsltData = newsletterIds?.['CHDE'];
    return chdeNsltData?.aId || chdeNsltData?.bId || newsletterTemplateId;
  }
  
  // If it's CHDE, use its own ID
  if (slug === 'CHDE') {
    return newsletterTemplateId;
  }
  
  // If it's BEFR, use BENL's newsletter ID
  if (slug === 'BEFR') {
    const benlNsltData = newsletterIds?.['BENL'];
    return benlNsltData?.aId || benlNsltData?.bId || newsletterTemplateId;
  }
  
  // If it's BENL, use its own ID
  if (slug === 'BENL') {
    return newsletterTemplateId;
  }
  
  // For all other slugs, use the provided ID
  return newsletterTemplateId;
};

export const checkAndActivateShopContent = async (
  item: ActivationItem,
  newsletterIds?: Record<string, { aId?: string; bId?: string }>
): Promise<ActivationResult> => {
  const { lpId, shopId, slug, landingPage, activateDate, deactivateDate, newsletterTemplateId } = item;
  
  const result: ActivationResult = {
    slug,
    lpId,
    shopId,
    wasInactive: false,
    activated: false,
  };

  try {
    // Check the current status
    const checkUrl = `https://www.prologistics.info/shop_content.php?id=${lpId}&shop_id=${shopId}`;
    const checkResponse = await axios.get(checkUrl, {
      withCredentials: true,
    });
    const html = checkResponse.data;

    // Search for the text content "inactive" or "active" in the banner status
    const bannerStatusMatch = html.match(/banner_status_(?:active|inactive)[^>]*>([^<]*)</i);
    const statusText = bannerStatusMatch ? bannerStatusMatch[1].trim().toLowerCase() : '';
    
    const isInactive = statusText === 'inactive';
    const isActive = statusText === 'active';

    result.wasInactive = isInactive;

    if (isActive) {
      result.activated = true;
      return result;
    }

    if (!isInactive) {
      const fallbackInactive = html.includes('banner_status_inactive');
      const fallbackActive = html.includes('banner_status_active');
      
      if (fallbackActive && !fallbackInactive) {
        result.activated = true;
        return result;
      }
      
      if (!fallbackInactive) {
        return result;
      }
    }

    // Get the correct newsletter template ID for paired shops
    const finalNewsletterTemplateId = getNewsletterTemplateId(slug, newsletterTemplateId, newsletterIds);
    const formData = new FormData();
    
    formData.append('shops[]', shopId);
    formData.append('id', lpId);
    formData.append('shop_id', shopId);
    formData.append('inactive', '0');
    formData.append('update', 'Activate and update');
    
    formData.append('activate_from_date', activateDate.date);
    formData.append('activate_from_time', activateDate.time);
    formData.append('deactivate_from_date', deactivateDate.date);
    formData.append('deactivate_from_time', deactivateDate.time);
    
    formData.append('name', landingPage);
    formData.append('newsletter_template_id', finalNewsletterTemplateId);

     await axios.post(
      'https://www.prologistics.info/shop_content.php',
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    result.activated = true;
    return result;
  } catch (error: any) {
    console.error(`Failed to check/activate shop content ${lpId} (${slug}):`, error);
    result.error = error.message;
    return result;
  }
};

export const checkAndActivateMultipleShopContents = async (
  items: Array<{
    lpId: string;
    shopId: string;
    slug: string;
    landingPage: string;
    activateDate: { date: string; time: string };
    deactivateDate: { date: string; time: string };
    newsletterTemplateId: string;
  }>,
  newsletterIds?: Record<string, { aId?: string; bId?: string }>,
  onProgress?: (completed: number, total: number, result: ActivationResult) => void
): Promise<ActivationResult[]> => {
  const total = items.length;
  let completed = 0;
  const results: ActivationResult[] = [];

  const promises = items.map((item) =>
    limit(async () => {
      const result = await checkAndActivateShopContent(
        {
          lpId: item.lpId,
          shopId: item.shopId,
          slug: item.slug,
          landingPage: item.landingPage,
          activateDate: item.activateDate,
          deactivateDate: item.deactivateDate,
          newsletterTemplateId: item.newsletterTemplateId,
        },
        newsletterIds
      );
      results.push(result);
      completed++;
      
      if (onProgress) {
        onProgress(completed, total, result);
      }
      
      return result;
    })
  );

  await Promise.all(promises);
  return results;
};