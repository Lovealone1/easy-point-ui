import type { AxiosInstance } from 'axios';
import { apiClient } from './api-client';
import type { ApiResponse, PaginatedApiResponse } from '@/shared/types/api.types';

export class BaseClientService<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  protected readonly endpoint: string;
  /**
   * Which application's credential these calls travel on. Defaults to the
   * tenant dashboard; console-only services pass `adminApiClient`, whose base
   * URL routes through the admin BFF and therefore the console session.
   *
   * Taken at construction rather than read per call, so a service is bound to
   * one application for its lifetime and cannot be flipped by navigation.
   */
  protected readonly client: AxiosInstance;

  constructor(endpoint: string, client: AxiosInstance = apiClient) {

    this.endpoint = endpoint.replace(/^\/+|\/+$/g, '');
    this.client = client;
  }


  async getAll(params?: Record<string, unknown>): Promise<PaginatedApiResponse<T>> {
    const { data } = await this.client.get<PaginatedApiResponse<T>>(`/${this.endpoint}`, { params });
    return data;
  }


  async getById(id: string | number): Promise<T> {
    const { data } = await this.client.get<T>(`/${this.endpoint}/${id}`);
    return data;
  }


  async create(payload: CreateDTO): Promise<T> {
    const { data } = await this.client.post<T>(`/${this.endpoint}`, payload);
    return data;
  }


  async update(id: string | number, payload: UpdateDTO): Promise<T> {
    const { data } = await this.client.patch<T>(`/${this.endpoint}/${id}`, payload);
    return data;
  }


  async patch(id: string | number, payload: Partial<UpdateDTO>): Promise<T> {
    const { data } = await this.client.patch<T>(`/${this.endpoint}/${id}`, payload);
    return data;
  }

  async delete(id: string | number): Promise<void> {
    const { data } = await this.client.delete<void>(`/${this.endpoint}/${id}`);
    return data;
  }
}
