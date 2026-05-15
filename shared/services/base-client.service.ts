import { apiClient } from './api-client';
import type { ApiResponse, PaginatedApiResponse } from '@/server/types/api.types';

export class BaseClientService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected readonly endpoint: string;

  constructor(endpoint: string) {

    this.endpoint = endpoint.replace(/^\/+|\/+$/g, '');
  }


  async getAll(params?: Record<string, unknown>): Promise<PaginatedApiResponse<T>> {
    const { data } = await apiClient.get<PaginatedApiResponse<T>>(`/${this.endpoint}`, { params });
    return data;
  }


  async getById(id: string | number): Promise<ApiResponse<T>> {
    const { data } = await apiClient.get<ApiResponse<T>>(`/${this.endpoint}/${id}`);
    return data;
  }


  async create(payload: CreateDTO): Promise<ApiResponse<T>> {
    const { data } = await apiClient.post<ApiResponse<T>>(`/${this.endpoint}`, payload);
    return data;
  }


  async update(id: string | number, payload: UpdateDTO): Promise<ApiResponse<T>> {
    const { data } = await apiClient.put<ApiResponse<T>>(`/${this.endpoint}/${id}`, payload);
    return data;
  }


  async patch(id: string | number, payload: Partial<UpdateDTO>): Promise<ApiResponse<T>> {
    const { data } = await apiClient.patch<ApiResponse<T>>(`/${this.endpoint}/${id}`, payload);
    return data;
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/${this.endpoint}/${id}`);
    return data;
  }
}
