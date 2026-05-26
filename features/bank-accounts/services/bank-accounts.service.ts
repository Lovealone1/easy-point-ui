import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { BankAccount, CreateBankAccountDTO, UpdateBankAccountDTO, BankAccountStatus } from "../types/bank-accounts.types"

export class BankAccountsServiceClass extends BaseClientService<
  BankAccount,
  CreateBankAccountDTO,
  UpdateBankAccountDTO
> {
  constructor() {
    super("/bank-accounts")
  }

  /**
   * Overrides create to support optional file upload (QR code) via multipart/form-data
   */
  override async create(payload: CreateBankAccountDTO): Promise<BankAccount> {
    const formData = new FormData()
    formData.append("name", payload.name)
    if (payload.accountNumber) {
      formData.append("accountNumber", payload.accountNumber)
    }
    if (payload.currency) {
      formData.append("currency", payload.currency)
    }
    if (payload.file) {
      formData.append("file", payload.file)
    }

    const { data } = await apiClient.post<BankAccount>(
      `/${this.endpoint}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return data;
  }

  /**
   * Changes the status of a bank account.
   * Target: PATCH /bank-accounts/:id/status
   */
  async changeStatus(id: string, status: BankAccountStatus): Promise<BankAccount> {
    const { data } = await apiClient.patch<BankAccount>(
      `/${this.endpoint}/${id}/status`,
      { status }
    )
    return data;
  }

  /**
   * Uploads a QR code for a bank account.
   * Target: POST /bank-accounts/:id/qrcode
   */
  async uploadQrCode(id: string, file: File): Promise<BankAccount> {
    const formData = new FormData()
    formData.append("file", file)

    const { data } = await apiClient.post<BankAccount>(
      `/${this.endpoint}/${id}/qrcode`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    )
    return data;
  }

  /**
   * Deletes the QR code for a bank account.
   * Target: DELETE /bank-accounts/:id/qrcode
   */
  async deleteQrCode(id: string): Promise<BankAccount> {
    const { data } = await apiClient.delete<BankAccount>(
      `/${this.endpoint}/${id}/qrcode`
    )
    return data;
  }
}

export const bankAccountsService = new BankAccountsServiceClass()
