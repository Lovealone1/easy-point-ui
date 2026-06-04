export type CostSource = 'PRODUCTION' | 'ESTIMATED' | 'UNKNOWN';

export interface SaleItemUtility {
  id: string;
  organizationId: string;
  saleUtilityId: string;
  productId: string;
  quantity: number;
  unitRevenue: number;
  unitCost: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  costSource: CostSource;
  createdAt: string;
}

export interface SaleUtility {
  id: string;
  organizationId: string;
  saleId: string;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  createdAt: string;
  updatedAt: string;
  items?: SaleItemUtility[];
  sale?: {
    id: string;
    clientId: string | null;
    clientName: string | null;
    totalAmount: number;
    performedByUserId: string | null;
    performedByUserEmail: string | null;
    createdAt: string;
  };
}

export interface UtilitySummary {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
  salesCount: number;
  period: {
    from: string | null;
    to: string | null;
  };
}

export interface ProductUtilityRow {
  productId: string;
  productName: string;
  categoryId: string | null;
  categoryName: string | null;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface CategoryUtilityRow {
  categoryId: string | null;
  categoryName: string | null;
  unitsSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface FindUtilitiesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  categoryId?: string;
  clientId?: string;
  performedByUserId?: string;
  paymentMethod?: string;
}
