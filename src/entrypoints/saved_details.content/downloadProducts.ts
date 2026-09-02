import { fetchProducts } from './fetchProducts';
import { downloadJSON, getAllSAId, isActive, ProductListFilter } from './productUtils';

export async function runDownloadProducts(): Promise<void> {
  const SA_IDS = getAllSAId();
  const products = await fetchProducts(SA_IDS);

  const { inActiveProducts, isInactiveProducts } = isActive(products);

  const activeFiltered = new ProductListFilter(products).processAllProducts();
  const inactiveFiltered = new ProductListFilter(inActiveProducts).processAllProducts();

  if (isInactiveProducts) {
    if (confirm('Inactive products found. Would you like to continue?')) {
      downloadJSON({ data: activeFiltered, name: 'products.json' });
      downloadJSON({ data: inactiveFiltered, name: 'inactive_products.json' });
    } else {
      downloadJSON({ data: inactiveFiltered, name: 'inactive_products.json' });
    }
    return;
  }

  downloadJSON({ data: activeFiltered, name: 'products.json' });
}

export function initDownloadProductsListener(): void {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.action !== 'download_products') {
      return;
    }

    void runDownloadProducts()
      .then(() => {
        sendResponse({ status: 'success' });
      })
      .catch((error: unknown) => {
        const msg = error instanceof Error ? error.message : String(error);
        alert(`Something went wrong. Try fetch product 1 by 1. ${msg}`);
        sendResponse({ status: 'error', error: msg });
      });

    // Keep the message channel open for async sendResponse
    return true;
  });
}