import { BaseClientService } from "@/shared/services/base-client.service"
import type { Role, CreateRoleDto, UpdateRoleDto } from "../types/roles.types"

export class RolesServiceClass extends BaseClientService<Role, CreateRoleDto, UpdateRoleDto> {
  constructor() {
    super("/roles")
  }
}

export const rolesService = new RolesServiceClass()
