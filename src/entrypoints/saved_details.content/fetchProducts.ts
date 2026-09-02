import type { ProductRaw, SaId } from './types';

const apiRoutes = {
  getProductName: (masterId: string) =>
    `https://www.prologistics.info/api/condensedSA/get/?id=${masterId}&block=article_name`,
  getShopDescription: (masterId: string) =>
    `https://www.prologistics.info/api/condensedSA/get/?id=${masterId}&block=ShopDesription`,
  getSlavesForMasterId: (masterId: string) =>
    `https://www.prologistics.info/api/condensedList/getList?saved_id=${masterId}`,
  getPrice: (slaveId: string) =>
    `https://www.prologistics.info/api/condensedSA/getSlave/?id=${slaveId}&block=saved_params`,
  getShopAliases: (masterId: string) =>
    `https://www.prologistics.info/api/condensedSA/get/?id=${masterId}&block=ShopSAAlias`,
  getPriceAndIsActive: (slaveId: string) =>
    `https://www.prologistics.info/api/condensedSA/getSlave/?id=${slaveId}&block=buttons`,
};

async function parseResponse<T>(
  responses: PromiseSettledResult<Response>[],
  cbs: ((json: any) => T) | Array<(json: any) => T>,
): Promise<T[]> {
  const out: T[] = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (response.status !== 'fulfilled') {
      console.log('Rejected response');
      continue;
    }
    if (!response.value.ok) {
      console.log('Response not ok while parsing.');
      continue;
    }
    const json = await response.value.json();
    const cb = Array.isArray(cbs) ? cbs[i] : cbs;
    out.push(cb(json));
  }

  return out;
}

async function parseResponsePrices(
  slaveResponses: PromiseSettledResult<Response>[],
): Promise<any[]> {
  const jsonData: any[] = [];

  for (const slaveResponse of slaveResponses) {
    if (slaveResponse.status === 'fulfilled') {
      if (slaveResponse.value.ok) {
        const responseJson = await slaveResponse.value.json();
        jsonData.push(responseJson.sa);
      } else {
        jsonData.push(slaveResponse.value);
      }
    } else {
      jsonData.push(slaveResponse.reason);
    }
  }

  return jsonData;
}

async function getProductData(product: SaId): Promise<ProductRaw[]> {
  const { getProductName, getSlavesForMasterId, getShopDescription, getPriceAndIsActive } =
    apiRoutes;

  const [name, slavesIds] = await parseResponse(
    await Promise.allSettled([
      fetch(getProductName(product.main_id)),
      fetch(getSlavesForMasterId(product.main_id)),
    ]),
    [
      (response: any) => response.sa.article_name,
      (response: any) => response.saCollection.list,
    ],
  );

  const shopDescription = await parseResponse(
    await Promise.allSettled([fetch(getShopDescription(product.main_id))]),
    (response: any) => response.sa,
  );

  const slavesPrices = await parseResponsePrices(
    await Promise.allSettled(
      (slavesIds as any[]).map((slave: { id: string }) =>
        fetch(getPriceAndIsActive(slave.id)),
      ),
    ),
  );

  return slavesPrices.map(item => ({
    ...item,
    article_name: name,
    shop_description: shopDescription[0],
  }));
}

export async function fetchProducts(ids: SaId[]): Promise<ProductRaw[]> {
  const idsResponse = await Promise.allSettled(ids.map(product => getProductData(product)));

  return idsResponse
    .map(item => (item.status === 'fulfilled' ? item.value : []))
    .flat();
}