import { BaseClientService } from "@/shared/services/base-client.service"
import type { Role } from "../types/roles.types"

export class RolesServiceClass extends BaseClientService<Role> {
  constructor() {
    super("/roles")
  }
}

export const rolesService = new RolesServiceClass()
