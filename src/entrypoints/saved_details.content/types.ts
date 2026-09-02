export type SaId = { main_id: string };

export type ProductRaw = {
  id?: string;
  article_name?: string;
  shop_description?: any;
  ShopSAAlias?: Record<string, any>;
  saved_params?: {
    master_sa?: string;
    username?: string;
    ShopPrice?: string | number;
    ShopHPrice?: string | number | null;
  };
  data?: {
    id?: string;
    username?: string;
    master_sa?: string;
    inactive?: string;
  };
  [key: string]: any;
};

export type FilteredProduct = {
  saved_params: {
    master_sa?: string;
    username?: string;
    ShopPrice?: string | number;
    ShopHPrice?: string | number | null;
  };
  data: {
    id?: string;
    username?: string;
    master_sa?: string;
  };
  id?: string;
  article_name?: string;
  ShopSAAlias?: Record<
    string,
    { language: string; id: string | null; value?: string }
  >;
  shop_description?: Record<
    string,
    { language: string; id: string | null; title: string }
  >;
};