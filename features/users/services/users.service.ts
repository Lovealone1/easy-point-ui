import { BaseClientService } from '@/shared/services/base-client.service';
import { apiClient } from '@/shared/services/api-client';
import type { User, UpdateUserDTO, GlobalRole } from '../types/users.types';

export class UsersServiceClass extends BaseClientService<User, any, UpdateUserDTO> {
  constructor() {
    super('users');
  }

  /**
   * Actualiza el rol global de un usuario
   */
  async updateRole(id: string, role: GlobalRole): Promise<User> {
    const { data } = await apiClient.patch<User>(`/${this.endpoint}/${id}/role`, { globalRole: role });
    return data;
  }
}

export const usersService = new UsersServiceClass();
