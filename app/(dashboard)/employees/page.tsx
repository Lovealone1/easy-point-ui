"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  DataTable,
  ColumnDef,
} from "@/shared/components/ui/data-table"
import { DataTableSearch } from "@/shared/components/ui/data-table-search"
import { DataTableAction } from "@/shared/components/ui/data-table-action"
import { DataTableToolbar } from "@/shared/components/ui/data-table-toolbar"
import { useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployeeStatus, useAssignEmployeeUser, useAddEmployeeNote } from "@/features/employees/hooks/use-employees"
import { useOrganizationUsers } from "@/features/organization-users/hooks/use-organization-users"
import type { Employee, EmployeeStatus } from "@/features/employees/types/employees.types"
import { Pencil, Eye, FileText, Trash2, Loader2, Briefcase, Hash, UserRound } from "lucide-react"

import { DynamicFormModal, FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { AddNotesModal } from "@/shared/components/ui/add-notes-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"
import { EmployeeDetailModal } from "@/features/employees/components/employee-detail-modal"
import { AssignUserModal } from "@/features/employees/components/assign-user-modal"

// ─── Status display config ─────────────────────────────────────────────────────
const STATUS_OPTIONS: { label: string; value: EmployeeStatus }[] = [
  { label: "Activo",      value: "ACTIVE" },
  { label: "Inactivo",    value: "INACTIVE" },
  { label: "En Licencia", value: "ON_LEAVE" },
  { label: "Terminado",   value: "TERMINATED" },
]

const STATUS_STYLES: Record<EmployeeStatus, string> = {
  ACTIVE:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
  INACTIVE:   "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/15",
  ON_LEAVE:   "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
  TERMINATED: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/15",
}

const STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE:     "Activo",
  INACTIVE:   "Inactivo",
  ON_LEAVE:   "En Licencia",
  TERMINATED: "Terminado",
}

// Status cycle: click to toggle to next logical state
const STATUS_CYCLE: Record<EmployeeStatus, EmployeeStatus> = {
  ACTIVE:     "INACTIVE",
  INACTIVE:   "ACTIVE",
  ON_LEAVE:   "ACTIVE",
  TERMINATED: "ACTIVE",
}

export default function EmployeesPage() {
  // ── Mutations ────────────────────────────────────────────────────────────────
  const createEmployeeMutation   = useCreateEmployee()
  const updateEmployeeMutation   = useUpdateEmployee()
  const deleteEmployeeMutation   = useDeleteEmployee()
  const updateStatusMutation     = useUpdateEmployeeStatus()
  const assignUserMutation       = useAssignEmployeeUser()
  const addEmployeeNoteMutation  = useAddEmployeeNote()

  // ── Modal states ─────────────────────────────────────────────────────────────
  const [isCreateOpen,     setIsCreateOpen]     = React.useState(false)
  const [isEditOpen,       setIsEditOpen]       = React.useState(false)
  const [isDetailsOpen,    setIsDetailsOpen]    = React.useState(false)
  const [isNotesOpen,      setIsNotesOpen]      = React.useState(false)
  const [isDeleteOpen,     setIsDeleteOpen]     = React.useState(false)
  const [isAssignUserOpen, setIsAssignUserOpen] = React.useState(false)
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null)

  // ── Filter / pagination state ────────────────────────────────────────────────
  const [search,          setSearch]          = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page,            setPage]            = React.useState(1)
  const [sortKey,         setSortKey]         = React.useState<string>("firstName")
  const [sortOrder,       setSortOrder]       = React.useState<"asc" | "desc">("asc")

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(handler)
  }, [search])

  React.useEffect(() => { setPage(1) }, [debouncedSearch])

  // ── Data fetch ───────────────────────────────────────────────────────────────
  const { data: employeesResponse, isLoading, error } = useEmployees({
    page,
    limit: 8,
    orderBy: sortKey,
    order: sortOrder === "asc" ? "ASC" : "DESC",
    search: debouncedSearch || undefined,
  })

  React.useEffect(() => {
    if (error) {
      toast.error("Error al cargar empleados", {
        description: error instanceof Error ? error.message : "Intente nuevamente más tarde.",
      })
    }
  }, [error])

  // ─── Org users for assign modal & form ───────────────────────────────────────
  const { data: orgUsersResponse, isLoading: orgUsersLoading } = useOrganizationUsers({ limit: 100 })
  const orgUsers = orgUsersResponse?.data ?? []

  // ── Form fields — aligned to Prisma schema ───────────────────────────────────
  const employeeFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: "firstName",
      label: "Nombre(s)",
      type: "text",
      placeholder: "Ej. Juan Carlos",
      required: true,
      gridCols: 1,
    },
    {
      name: "lastName",
      label: "Apellido(s)",
      type: "text",
      placeholder: "Ej. García López",
      required: true,
      gridCols: 1,
    },
    {
      name: "taxId",
      label: "Cédula / Tax ID",
      type: "text",
      placeholder: "Ej. 1.234.567-8",
      required: false,
      gridCols: 1,
    },
    {
      name: "position",
      label: "Cargo",
      type: "text",
      placeholder: "Ej. Cajero, Chef, Mesero",
      required: true,
      gridCols: 1,
    },
    {
      name: "salary",
      label: "Salario",
      type: "number",
      placeholder: "Ej. 1500000",
      required: true,
      gridCols: 1,
    },
    {
      name: "hireDate",
      label: "Fecha de Contratación",
      type: "text",
      placeholder: "Ej. 2024-01-15",
      required: true,
      gridCols: 1,
    },
    {
      name: "email",
      label: "Correo Electrónico",
      type: "text",
      placeholder: "Ej. empleado@empresa.com",
      required: false,
      gridCols: 1,
    },
    {
      name: "phone",
      label: "Teléfono",
      type: "text",
      placeholder: "Ej. +57 300 123 4567",
      required: false,
      gridCols: 1,
    },
    {
      name: "status",
      label: "Estado",
      type: "select",
      required: false,
      gridCols: 1,
      options: STATUS_OPTIONS.map((s) => ({ label: s.label, value: s.value })),
    },
    {
      name: "userId",
      label: "Usuario Asignado (Opcional)",
      type: "select",
      required: false,
      gridCols: 1,
      placeholder: "Sin asignar",
      options: [
        { label: "Sin asignar", value: "none" },
        ...orgUsers.map((u) => {
          const name = [u.user?.firstName, u.user?.lastName].filter(Boolean).join(" ")
          const label = name ? `${name} (${u.user?.email})` : u.user?.email
          return { label: label || "Usuario Desconocido", value: u.userId }
        }),
      ],
    },
  ], [orgUsers])

  // ── Sort handler ─────────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
    setPage(1)
  }

  // ── Column definitions ────────────────────────────────────────────────────────
  const columns: ColumnDef<Employee>[] = [
    {
      key: "firstName",
      header: "Empleado",
      sortable: true,
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-0">
          <span className="font-semibold text-foreground leading-snug truncate">
            {row.firstName} {row.lastName}
          </span>
          {row.user && (
            <span className="text-xs text-brand-500/80 mt-0.5 truncate">
              {row.user.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "taxId",
      header: "Cédula",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.taxId ? (
            <>
              <Hash className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-sm text-foreground/80 font-mono">{row.taxId}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground/50 italic">Sin documento</span>
          )}
        </div>
      ),
    },
    {
      key: "position",
      header: "Cargo",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span className="text-sm text-foreground/80 truncate">{row.position}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (row) => {
        const isPending =
          updateStatusMutation.isPending &&
          updateStatusMutation.variables?.id === row.id
        const nextStatus = STATUS_CYCLE[row.status]
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              updateStatusMutation.mutate(
                { id: row.id, status: nextStatus },
                {
                  onSuccess: (res) =>
                    toast.success(`Estado actualizado: ${STATUS_LABELS[res.status]}`),
                  onError: () =>
                    toast.error("Error al cambiar el estado del empleado"),
                }
              )
            }}
            disabled={isPending}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${STATUS_STYLES[row.status]}`}
            title={`Click para cambiar a: ${STATUS_LABELS[nextStatus]}`}
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {STATUS_LABELS[row.status]}
          </button>
        )
      },
    },
    {
      key: "userId",
      header: "Usuario",
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.user ? (
            <>
              <UserRound className="h-3.5 w-3.5 text-brand-500/70 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-foreground/80 font-medium truncate max-w-[140px]">
                  {[row.user.firstName, row.user.lastName].filter(Boolean).join(" ") || row.user.email}
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-[140px]" title={`ID: ${row.user.id}`}>
                  {row.user.id.split('-')[0]}...
                </span>
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">Sin usuario</span>
          )}
        </div>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      className: "w-[150px]",
      render: (row) => {
        const isDeleting    = deleteEmployeeMutation.isPending   && deleteEmployeeMutation.variables   === row.id
        const isEditing     = updateEmployeeMutation.isPending   && updateEmployeeMutation.variables?.id === row.id
        const isAddingNote  = addEmployeeNoteMutation.isPending  && addEmployeeNoteMutation.variables?.id === row.id
        const isAssigning   = assignUserMutation.isPending       && assignUserMutation.variables?.id   === row.id

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setSelectedEmployee(row); setIsDetailsOpen(true) }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer"
              title="Ver detalles"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => { setSelectedEmployee(row); setIsEditOpen(true) }}
              disabled={isEditing}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Editar"
            >
              {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => { setSelectedEmployee(row); setIsAssignUserOpen(true) }}
              disabled={isAssigning}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Asignar usuario"
            >
              {isAssigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserRound className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => { setSelectedEmployee(row); setIsNotesOpen(true) }}
              disabled={isAddingNote}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Agregar nota"
            >
              {isAddingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={() => { setSelectedEmployee(row); setIsDeleteOpen(true) }}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Eliminar"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        )
      },
    },
  ]

  // ─── Assign user handler ─────────────────────────────────────────────────────
  const handleAssignUser = (userId: string | null) => {
    if (!selectedEmployee) return
    assignUserMutation.mutate(
      { id: selectedEmployee.id, userId },
      {
        onSuccess: () => {
          toast.success(userId ? "Usuario asignado correctamente" : "Usuario desvinculado")
          setIsAssignUserOpen(false)
        },
        onError: () => toast.error("Error al asignar el usuario"),
      }
    )
  }

  // ─── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <DataTableToolbar
        searchSection={
          <DataTableSearch
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, cargo o cédula..."
            shortcutKey="/"
            shape="md"
          />
        }
        actionSection={
          <DataTableAction
            actionType="create"
            label="Nuevo Empleado"
            shape="md"
            onClick={() => setIsCreateOpen(true)}
          />
        }
      />

      <DataTable
        columns={columns}
        data={employeesResponse?.data || []}
        loading={isLoading}
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={{
          currentPage: page,
          totalPages: employeesResponse?.meta?.pageCount || 1,
          onPageChange: setPage,
          totalItems: employeesResponse?.meta?.itemCount || 0,
          itemsPerPage: 8,
        }}
        onRowClick={(row) => { setSelectedEmployee(row); setIsDetailsOpen(true) }}
        glassy={true}
      />

      {/* Create */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo Empleado"
        description="Registra un nuevo empleado en la organización."
        fields={employeeFields}
        submitLabel="Crear Empleado"
        defaultValues={{ userId: "", status: "ACTIVE" }}
        isLoading={createEmployeeMutation.isPending}
        onSubmit={(values) => {
          const payload = { ...values }
          if (payload.userId === "none" || payload.userId === "") payload.userId = null
          
          createEmployeeMutation.mutate(payload as any, {
            onSuccess: () => { toast.success("Empleado creado con éxito"); setIsCreateOpen(false) },
            onError: (err) => toast.error("Error al crear el empleado", {
              description: err instanceof Error ? err.message : "Intente nuevamente.",
            }),
          })
        }}
      />

      {/* Edit */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedEmployee(null) }}
        title="Editar Empleado"
        description="Actualiza la información del empleado seleccionado."
        fields={employeeFields}
        submitLabel="Guardar Cambios"
        defaultValues={selectedEmployee ? { ...selectedEmployee, userId: selectedEmployee.userId ?? "none" } : undefined}
        isLoading={updateEmployeeMutation.isPending}
        onSubmit={(values) => {
          if (!selectedEmployee) return

          const patchPayload: Record<string, any> = {}
          Object.keys(values).forEach((key) => {
            let newValue = values[key]
            if (key === "userId" && (newValue === "none" || newValue === "")) newValue = null

            const oldValue = (selectedEmployee as any)[key]
            
            // Allow transitions to null for userId
            if (key === "userId" && newValue === null && oldValue !== null) {
              patchPayload[key] = newValue
              return
            }

            const isOldFalsy = oldValue === null || oldValue === undefined || oldValue === ""
            const isNewFalsy = newValue === null || newValue === undefined || newValue === ""
            if (isOldFalsy && isNewFalsy) return
            if (newValue !== oldValue) patchPayload[key] = newValue
          })

          if (Object.keys(patchPayload).length === 0) {
            toast.info("No se realizaron modificaciones")
            setIsEditOpen(false)
            setSelectedEmployee(null)
            return
          }

          updateEmployeeMutation.mutate(
            { id: selectedEmployee.id, payload: patchPayload },
            {
              onSuccess: () => {
                toast.success("Empleado actualizado con éxito")
                setIsEditOpen(false)
                setSelectedEmployee(null)
              },
              onError: (err) => toast.error("Error al actualizar el empleado", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              }),
            }
          )
        }}
      />

      {/* Detail */}
      <EmployeeDetailModal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedEmployee(null) }}
        employee={selectedEmployee}
        onAssignUser={() => setIsAssignUserOpen(true)}
      />

      {/* Assign user */}
      <AssignUserModal
        isOpen={isAssignUserOpen}
        onClose={() => setIsAssignUserOpen(false)}
        employee={selectedEmployee}
        users={orgUsers}
        usersLoading={orgUsersLoading}
        isAssigning={assignUserMutation.isPending}
        onAssign={handleAssignUser}
      />

      {/* Notes */}
      <AddNotesModal
        isOpen={isNotesOpen}
        onClose={() => { setIsNotesOpen(false); setSelectedEmployee(null) }}
        title={`Nota para: ${selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ""}`}
        initialNote={selectedEmployee?.notes || ""}
        isLoading={addEmployeeNoteMutation.isPending}
        onSubmit={(note) => {
          if (!selectedEmployee) return
          addEmployeeNoteMutation.mutate(
            { id: selectedEmployee.id, notes: note },
            {
              onSuccess: () => {
                toast.success("Nota guardada correctamente")
                setIsNotesOpen(false)
                setSelectedEmployee(null)
              },
              onError: (err) => toast.error("Error al guardar la nota", {
                description: err instanceof Error ? err.message : "Intente nuevamente.",
              }),
            }
          )
        }}
      />

      {/* Delete */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedEmployee(null) }}
        title="¿Eliminar empleado?"
        description={`Esta acción no se puede deshacer. Se eliminará permanentemente al empleado "${selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ""}" del sistema.`}
        confirmLabel="Eliminar Empleado"
        cancelLabel="Cancelar"
        isLoading={deleteEmployeeMutation.isPending}
        onConfirm={() => {
          if (!selectedEmployee) return
          deleteEmployeeMutation.mutate(selectedEmployee.id, {
            onSuccess: () => {
              toast.success("Empleado eliminado correctamente")
              setIsDeleteOpen(false)
              setSelectedEmployee(null)
            },
            onError: (err) => toast.error("Error al eliminar el empleado", {
              description: err instanceof Error ? err.message : "Intente nuevamente.",
            }),
          })
        }}
      />
    </div>
  )
}
