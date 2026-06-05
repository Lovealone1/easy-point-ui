import { apiClient } from '@/shared/services/api-client';

export interface UpdateOrganizationConfigPayload {
  primaryColor?: string | null;
  defaultTheme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  timezone?: string;
  currency?: string;
  language?: string;
  dateFormat?: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  receiptFooter?: string | null;
  organizationName?: string;
  organizationEmail?: string | null;
}

export async function getConfig(): Promise<any> {
  const response = await apiClient.get('/organization-configs');
  return response.data;
}

export async function updateConfig(payload: UpdateOrganizationConfigPayload): Promise<any> {
  const response = await apiClient.patch('/organization-configs', payload);
  return response.data;
}

export async function uploadLogo(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/organization-configs/logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteLogo(): Promise<any> {
  const response = await apiClient.delete('/organization-configs/logo');
  return response.data;
}

export async function uploadLogoShort(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/organization-configs/logo-short', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function deleteLogoShort(): Promise<any> {
  const response = await apiClient.delete('/organization-configs/logo-short');
  return response.data;
}
