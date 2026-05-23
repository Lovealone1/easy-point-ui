export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  salePrice: number;
  costPrice: number | null;
  categoryId: string | null;
  isPurchased: boolean;
  recipeId: string | null;
  imageUrl: string | null;
  notes: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindProductsParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  name?: string;
  sku?: string;
  categoryId?: string;
  isActive?: boolean;
  isPurchased?: boolean;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  salePrice: number;
  costPrice?: number;
  categoryId?: string;
  isPurchased?: boolean;
  imageUrl?: string;
  notes?: string;
}

export type UpdateProductDTO = Partial<Omit<CreateProductDTO, 'sku'>>;
