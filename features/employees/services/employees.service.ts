import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { Employee, CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeStatus } from "../types/employees.types"

export class EmployeesServiceClass extends BaseClientService<
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO
> {
  constructor() {
    super("/employees")
  }

  /**
   * Updates the status of an employee.
   * Target: PATCH /employees/:id/status
   */
  async updateStatus(id: string, status: EmployeeStatus): Promise<Employee> {
    const { data } = await apiClient.patch<Employee>(
      `/${this.endpoint}/${id}/status`,
      { status }
    )
    return data;
  }

  /**
   * Assigns an organization user to an employee.
   * Target: PATCH /employees/:id/assign-user
   */
  async assignUser(id: string, userId: string | null): Promise<Employee> {
    const { data } = await apiClient.patch<Employee>(
      `/${this.endpoint}/${id}/assign-user`,
      { userId }
    )
    return data;
  }

  /**
   * Appends an administrative note to the employee.
   * Target: POST /employees/:id/notes
   */
  async addNote(id: string, notes: string): Promise<Employee> {
    const { data } = await apiClient.post<Employee>(
      `/${this.endpoint}/${id}/notes`,
      { notes }
    )
    return data;
  }
}

export const employeesService = new EmployeesServiceClass()
