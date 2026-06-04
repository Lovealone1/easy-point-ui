import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type {
  SaleUtility,
  UtilitySummary,
  ProductUtilityRow,
  CategoryUtilityRow,
  FindUtilitiesParams,
} from "../types/utilities.types"

export class UtilitiesServiceClass extends BaseClientService<
  SaleUtility,
  any,
  any
> {
  constructor() {
    super("/utilities")
  }

  async getSummary(params?: FindUtilitiesParams): Promise<UtilitySummary> {
    const { data } = await apiClient.get<UtilitySummary>(`/${this.endpoint}/summary`, { params })
    return data
  }

  async getByProduct(params?: FindUtilitiesParams): Promise<ProductUtilityRow[]> {
    const { data } = await apiClient.get<ProductUtilityRow[]>(`/${this.endpoint}/by-product`, { params })
    return data
  }

  async getByCategory(params?: FindUtilitiesParams): Promise<CategoryUtilityRow[]> {
    const { data } = await apiClient.get<CategoryUtilityRow[]>(`/${this.endpoint}/by-category`, { params })
    return data
  }
}

export const utilitiesService = new UtilitiesServiceClass()
