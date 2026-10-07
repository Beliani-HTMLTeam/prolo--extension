import type { FilteredProduct, ProductRaw, SaId } from './types';

export function getAllSAId(): SaId[] {
  const nodes = document.querySelectorAll("tr[id^='row-']");
  if (!nodes.length) {
    throw new Error('SA Nodes not found.');
  }

  return [...nodes].map(item => ({
    main_id: item.getAttribute('id')!.split('-')[1],
  }));
}

export function downloadJSON({ data, name }: { data: unknown; name: string }): void {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const urlBlob = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.download = name;
  a.href = urlBlob;
  a.click();
  a.remove();

  URL.revokeObjectURL(urlBlob);
}

export function isActive(products: ProductRaw[]): {
  isInactiveProducts: boolean;
  inActiveProducts: ProductRaw[];
} {
  const inActiveProducts: ProductRaw[] = [];

  for (const product of products) {
    if (product.data?.inactive === '1') {
      inActiveProducts.push(product);
    }
  }

  return {
    isInactiveProducts: inActiveProducts.length > 0,
    inActiveProducts,
  };
}

export class ProductListFilter {
  constructor(private products: ProductRaw[]) {}

  processShopSAAlias(item: ProductRaw) {
    const processedAlias: FilteredProduct['ShopSAAlias'] = {};

    if (item?.ShopSAAlias) {
      for (const langKey of Object.keys(item.ShopSAAlias)) {
        const aliasData = item.ShopSAAlias[langKey];
        processedAlias![langKey] = {
          language: aliasData.language,
          id: aliasData.id,
          value: aliasData.value,
        };
      }
    }

    return processedAlias;
  }

  processShopDescription(item: ProductRaw) {
    const processedDescription: FilteredProduct['shop_description'] = {};

    if (item?.shop_description?.automatic_titles) {
      for (const langKey of Object.keys(item.shop_description.automatic_titles)) {
        processedDescription![langKey] = {
          language: langKey,
          id: item.ShopSAAlias?.[langKey]?.id ?? null,
          title: item.shop_description.automatic_titles[langKey],
        };
      }
    }

    return processedDescription;
  }

  processAllProducts(): FilteredProduct[] {
    return this.products.map(item => {
      const savedParams = item.saved_params || {};
      const data = item.data || {};

      const processedProduct: FilteredProduct = {
        saved_params: {
          master_sa: savedParams.master_sa,
          username: savedParams.username,
          ShopPrice: savedParams.ShopPrice,
          ShopHPrice:
            savedParams.username !== 'Beliani PL' ? savedParams.ShopHPrice : null,
        },
        data: {
          id: data.id,
          username: data.username,
          master_sa: data.master_sa,
        },
        id: item.id,
        article_name: item.article_name,
      };

      if (data.username === 'Beliani') {
        processedProduct.ShopSAAlias = this.processShopSAAlias(item);
        processedProduct.shop_description = this.processShopDescription(item);
      }

      return processedProduct;
    });
  }
}