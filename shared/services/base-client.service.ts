import { apiClient } from './api-client';
import type { ApiResponse, PaginatedApiResponse } from '@/shared/types/api.types';

export class BaseClientService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected readonly endpoint: string;

  constructor(endpoint: string) {

    this.endpoint = endpoint.replace(/^\/+|\/+$/g, '');
  }


  async getAll(params?: Record<string, unknown>): Promise<PaginatedApiResponse<T>> {
    const { data } = await apiClient.get<PaginatedApiResponse<T>>(`/${this.endpoint}`, { params });
    return data;
  }


  async getById(id: string | number): Promise<T> {
    const { data } = await apiClient.get<T>(`/${this.endpoint}/${id}`);
    return data;
  }


  async create(payload: CreateDTO): Promise<T> {
    const { data } = await apiClient.post<T>(`/${this.endpoint}`, payload);
    return data;
  }


  async update(id: string | number, payload: UpdateDTO): Promise<T> {
    const { data } = await apiClient.patch<T>(`/${this.endpoint}/${id}`, payload);
    return data;
  }


  async patch(id: string | number, payload: Partial<UpdateDTO>): Promise<T> {
    const { data } = await apiClient.patch<T>(`/${this.endpoint}/${id}`, payload);
    return data;
  }

  async delete(id: string | number): Promise<void> {
    const { data } = await apiClient.delete<void>(`/${this.endpoint}/${id}`);
    return data;
  }
}
