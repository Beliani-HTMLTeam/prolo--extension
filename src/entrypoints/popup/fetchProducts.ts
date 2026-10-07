import { getProductIdsByShop } from './utils/getProductIdsByShop';
import { getProductName } from './utils/getProductName';
import { getProductDetails } from './utils/getProductDetails';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import pTimeout from 'p-timeout';
import pMinDelay from 'p-min-delay';
import pProps from 'p-props';
import { type ProductData } from '../newtab/types/ProductData';
import { type ProductWithShops } from '../newtab/types/ProductWithShops';
import { type ShopDetails } from '../newtab/types/ShopDetails';

async function getOrigin(): Promise<string | undefined> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0]?.id;

    if (activeTab == null) return undefined;

    try {
      const response = await browser.tabs.sendMessage(activeTab, { action: 'getWindowOrigin' });

      return response.origin;
    } catch (error) {
      console.error('Could not send message:', error);
      return undefined;
    }
  } catch (err) {
    console.error(err);
    return undefined;
  }
}

export async function getTableData() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0].id!;

    browser.tabs
      .sendMessage(activeTab, { action: 'getTableData' })
      .then(async response => {
        if (!response?.exists) return console.log('Table not found');

        await fetchProducts(response.rows);
      })
      .catch(error => {
        console.error('Could not send message:', error);
      });
  } catch (err) {
    console.error(err);
  }
}

async function fetchProducts(rows: any[]) {
  console.log('Table found! Processing products...');
  console.time('Total fetch time');

  const origin = (await getOrigin()) ?? 'https://localhost/';
  console.log('Origin:', origin);

  // Process up to 5 concurrent products
  const productLimit = pLimit(5);

  const productsArray = await Promise.all(
    rows.map(row =>
      productLimit(async () => {
        const productId = row.value;
        console.log(`\nFetching product: ${productId}`);

        // Fetch product name and shop IDs in parallel with timeout
        const { name, shops } = await pProps({
          name: pTimeout(
            pRetry(() => getProductName(origin, productId), {
              retries: 3,
              minTimeout: 1000,
            }),
            { milliseconds: 10000 },
          ),
          shops: pTimeout(
            pRetry(() => getProductIdsByShop(origin, productId), {
              retries: 3,
              minTimeout: 1000,
            }),
            { milliseconds: 10000 },
          ),
        });

        const productName = name;
        const productMap = shops;

        const shopDetails: Record<string, ShopDetails> = {};
        const entries = Object.entries(productMap);

        console.log(`  Found ${entries.length} shops for product ${productId}`);

        // Process up to 8 concurrent shops per product
        const shopLimit = pLimit(8);

        const shopResults = await Promise.all(
          entries.map(([shopCode, shopData]) =>
            shopLimit(async () => {
              try {
                const details = await pMinDelay(
                  pRetry(
                    () =>
                      pTimeout(getProductDetails(origin, shopData.id), {
                        milliseconds: 5000,
                      }),
                    {
                      retries: 3,
                      minTimeout: 1000,
                    },
                  ),
                  100, // delay between requests to avoid rate limiting (real version - avoid killing prolo xD)
                );

                // build product url using the shop name (eg. Beliani.ch) from API + path from details
                let fullUrl = '';
                if (details.url && details.url !== '' && shopData.shopUrl) {
                  try {
                    const productUrl = new URL(`https://${shopData.shopUrl}`);
                    productUrl.pathname = details.url;
                    fullUrl = productUrl.href;
                  } catch (urlError) {
                    console.warn(`Invalid URL for ${shopCode}:`, shopData.shopUrl);
                    fullUrl = '';
                  }
                }

                return [
                  shopCode,
                  {
                    price: details.price,
                    oldPrice: details.oldPrice,
                    url: fullUrl,
                  } as ShopDetails,
                ] as const;
              } catch (error) {
                console.error(`Error fetching details for ${shopCode}:`, error);
                return [
                  shopCode,
                  {
                    price: '00.00',
                    oldPrice: '00.00',
                    url: '',
                  } as ShopDetails,
                ] as const;
              }
            }),
          ),
        );

        // building final shop details object
        for (const [shopUrl, shopData] of shopResults) {
          shopDetails[shopUrl] = shopData;
        }

        // final product: { id, name | 'Product [id] not found', shops: { [slug]: { price | '00.00', oldPrice | '00.00', url | '' } } }
        const product: ProductWithShops = {
          id: productId,
          name: productName,
          shops: shopDetails,
        };

        console.log(`✅ Completed product ${productId} with ${Object.keys(shopDetails).length} shops`);
        return product;
      }),
    ),
  );

  // Convert array to object with productId as keys, removing the id field
  const products: Record<string, ProductData> = {};
  productsArray.forEach(product => {
    products[product.id] = {
      name: product.name,
      shops: product.shops,
    };
  });

  console.timeEnd('Total fetch time');
  console.log('\n📦 All products processed:', products);

  return products;
}
