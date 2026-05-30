import { OrganizationUsersDataTable } from "@/features/organization-users/components/organization-users-data-table"

export default function OrganizationUsersPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Usuarios de Organización</h1>
        <p className="text-muted-foreground">
          Administra los accesos y roles de los miembros dentro de tu organización actual.
        </p>
      </div>

      <OrganizationUsersDataTable />
    </div>
  )
}
