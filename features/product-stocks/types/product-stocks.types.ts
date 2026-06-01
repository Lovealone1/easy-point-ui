export interface ProductStock {
  id: string;
  organizationId: string;
  productId: string;
  location: string;
  quantity: number;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
  // UI compatibility field
  productName?: string;
}

export interface FindProductStocksParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  productId?: string;
  location?: string;
}

export interface CreateProductStockDTO {
  productId: string;
  location?: string;
  minQuantity?: number;
}
