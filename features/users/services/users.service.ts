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

  /**
   * Solicita un código OTP para cambiar el correo electrónico del usuario
   */
  async requestEmailOtp(id: string, newEmail: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(`/${this.endpoint}/${id}/email/request-otp`, { newEmail });
    return data;
  }

  /**
   * Verifica el OTP y actualiza el correo electrónico del usuario
   */
  async verifyEmailOtp(id: string, newEmail: string, otp: string): Promise<User> {
    const { data } = await apiClient.patch<User>(`/${this.endpoint}/${id}/email`, { newEmail, otp });
    return data;
  }
}

export const usersService = new UsersServiceClass();
