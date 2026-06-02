// ─── Entity ──────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  /** Category display name (stored in Title Case) */
  name: string;
  /** 3-character alphanumeric identifier, always UPPERCASE (e.g. "BEV") */
  code: string;
  /** Optional administrative notes */
  notes: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Find Params ─────────────────────────────────────────────────────────────

export interface FindProductCategoriesParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  /** Full-text search across name and code */
  search?: string;
  name?: string;
  code?: string;
  isActive?: boolean;
}

// ─── Create DTO ──────────────────────────────────────────────────────────────

export interface CreateProductCategoryDTO {
  /** Category name — auto-capitalized to Title Case by the backend */
  name: string;
  /**
   * 3-letter alphanumeric code — must be exactly 3 characters.
   * The backend normalizes it to UPPERCASE (e.g. "bev" → "BEV").
   * Must be unique per organization.
   */
  code: string;
  /** Optional free-form notes for internal use */
  notes?: string;
}

// ─── Update DTO ───────────────────────────────────────────────────────────────

/** All fields are optional for PATCH. `code` is included because it is editable. */
export type UpdateProductCategoryDTO = Partial<CreateProductCategoryDTO> & {
  isActive?: boolean;
};
