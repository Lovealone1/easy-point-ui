export interface SupplyStock {
  id: string;
  organizationId: string;
  supplyId: string;
  location: string;
  quantity: number;
  minQuantity: number;
  createdAt: string;
  updatedAt: string;
  supplyName?: string;
}

export interface FindSupplyStocksParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  supplyId?: string;
  location?: string;
}

export interface CreateSupplyStockDTO {
  supplyId: string;
  location?: string;
  minQuantity?: number;
}

export interface UpdateSupplyStockDTO {
  location?: string;
  minQuantity?: number;
}
