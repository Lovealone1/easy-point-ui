import { apiClient } from '@/shared/services/api-client'

export type ImportValidationError = {
  row: number
  column?: string
  code: string
  message: string
}

export type ImportValidationResult = {
  valid: boolean
  resource: string
  fileHash: string
  totalRows: number
  validRows: number
  invalidRows: number
  preview: Array<Record<string, unknown> & { __row: number }>
  errors: ImportValidationError[]
}

export class MasterImportsService {
  async downloadTemplate(resource: string, format: 'xlsx' | 'csv'): Promise<void> {
    const response = await apiClient.get(`/${resource}/import/template`, {
      params: { format },
      responseType: 'blob',
    })
    const contentDisposition = response.headers['content-disposition'] as string | undefined
    const match = contentDisposition?.match(/filename="?([^";]+)"?/i)
    const filename = match?.[1] ?? `${resource}-plantilla.${format}`
    const url = URL.createObjectURL(response.data)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  async validate(resource: string, file: File): Promise<ImportValidationResult> {
    const body = new FormData()
    body.append('file', file)
    const { data } = await apiClient.post<ImportValidationResult>(`/${resource}/import/validate`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  }

  async import(resource: string, file: File, fileHash: string): Promise<{ createdRows: number }> {
    const body = new FormData()
    body.append('file', file)
    const { data } = await apiClient.post<{ createdRows: number }>(`/${resource}/import`, body, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-idempotency-key': globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        'x-import-file-hash': fileHash,
      },
    })
    return data
  }
}

export const masterImportsService = new MasterImportsService()

