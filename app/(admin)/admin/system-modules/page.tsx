// ─────────────────────────────────────────────────────────────────────────────
// app/(admin)/admin/system-modules/page.tsx
//
// System Modules CRUD Administration.
// Global administrators can view, filter, sort, paginate, create, edit, toggle,
// and delete modules in the catalog.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useMemo, useState, useEffect } from "react"
import {
  Pencil,
  Trash2,
  Plus,
  Puzzle,
  Loader2,
  AlertCircle,
  Eye,
  Search,
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/shared/lib/utils"
import { Switch } from "@/shared/components/ui/switch"

// Table and Toolbar shared primitives
import { DataTable, type ColumnDef } from "@/shared/components/ui/data-table"
import { Input } from "@/shared/components/ui/input"

// Modal shared primitives
import { DynamicFormModal, type FormFieldSchema } from "@/shared/components/ui/dynamic-form-modal"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

// Feature bindings
import {
  useSystemModules,
  useCreateSystemModule,
  useUpdateSystemModule,
  useDeleteSystemModule,
  useToggleSystemModule,
} from "@/features/system-modules/hooks/use-system-modules"
import { SystemModulesDetailModal } from "@/features/system-modules/components/system-modules-detail-modal"
import type { SystemModule } from "@/features/system-modules/types/system-modules.types"

// ─────────────────────────────────────────────────────────────────────────────
// Module Icon Resolver Component
// ─────────────────────────────────────────────────────────────────────────────

interface ModuleIconProps {
  name?: string | null
  className?: string
}

function ModuleIcon({ name, className }: ModuleIconProps) {
  if (!name) {
    return <Puzzle className={className} />
  }

  // Convert kebab-case (e.g., "credit-card") to PascalCase (e.g., "CreditCard")
  const formattedName = name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("")

  const IconComponent =
    (LucideIcons as Record<string, any>)[formattedName] ||
    (LucideIcons as Record<string, any>)[name] ||
    Puzzle

  return <IconComponent className={className} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SystemModulesAdminPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Modals visibility state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SystemModule | null>(null)

  // Mutations
  const createMutation = useCreateSystemModule()
  const updateMutation = useUpdateSystemModule()
  const deleteMutation = useDeleteSystemModule()
  const toggleMutation = useToggleSystemModule()

  // Local state to track optimistic toggle switches in progress.
  // Stores { [moduleId]: targetCheckedValue }
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({})

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch all system modules
  const { data: systemModules, isLoading, error, refetch } = useSystemModules()

  // Client-side filtering
  const filteredModules = useMemo(() => {
    if (!systemModules) return []
    return systemModules.filter((mod) => {
      const term = debouncedSearch.toLowerCase()
      return term
        ? mod.name.toLowerCase().includes(term) || mod.key.toLowerCase().includes(term)
        : true
    })
  }, [systemModules, debouncedSearch])

  // Client-side sorting
  const [sortKey, setSortKey] = useState<string>("sortOrder")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const sortedModules = useMemo(() => {
    const copy = [...filteredModules]
    copy.sort((a: any, b: any) => {
      const valA = a[sortKey] ?? ""
      const valB = b[sortKey] ?? ""
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA
      }
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })
    return copy
  }, [filteredModules, sortKey, sortOrder])

  // Client-side pagination
  const [page, setPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(sortedModules.length / itemsPerPage)
  
  const paginatedModules = useMemo(() => {
    return sortedModules.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  }, [sortedModules, page])

  // Reset to page 1 when query filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Active status toggle handler
  const handleStatusToggle = (row: SystemModule, checked: boolean) => {
    const key = row.id
    if (key in pendingToggles) return

    setPendingToggles((prev) => ({ ...prev, [key]: checked }))

    toggleMutation.mutate(
      { id: row.id, isActive: checked },
      {
        onSuccess: () => {
          setPendingToggles((prev) => {
            const copy = { ...prev }
            delete copy[key]
            return copy
          })
          toast.success(`Módulo "${row.name}" ${checked ? "activado" : "desactivado"} con éxito`)
        },
        onError: (err: any) => {
          setPendingToggles((prev) => {
            const copy = { ...prev }
            delete copy[key]
            return copy
          })
          const msg = err.response?.data?.message || "Error al actualizar estado del módulo"
          toast.error(msg)
        },
      }
    )
  }

  // Create Form Fields
  const createFields = useMemo<FormFieldSchema[]>(() => [
    {
      name: "key",
      label: "Llave (Única)",
      type: "text",
      required: true,
      gridCols: 1,
      placeholder: "ej: billing",
    },
    {
      name: "name",
      label: "Nombre del Módulo",
      type: "text",
      required: true,
      gridCols: 1,
      placeholder: "ej: Facturación",
    },
    {
      name: "icon",
      label: "Icono (kebab-case)",
      type: "text",
      required: false,
      gridCols: 1,
      placeholder: "ej: credit-card",
    },
    {
      name: "sortOrder",
      label: "Orden de Clasificación",
      type: "number",
      required: false,
      gridCols: 1,
      placeholder: "ej: 5",
    },
    {
      name: "isActive",
      label: "Activo por defecto",
      type: "boolean",
      gridCols: 2,
    },
    {
      name: "description",
      label: "Descripción del Módulo",
      type: "textarea",
      gridCols: 2,
      placeholder: "Descripción breve de las características...",
    },
  ], [])

  // Edit Form Fields (key is excluded since it is immutable)
  const editFields = useMemo<FormFieldSchema[]>(() => [
    {
      name: "name",
      label: "Nombre del Módulo",
      type: "text",
      required: true,
      gridCols: 1,
      placeholder: "ej: Facturación",
    },
    {
      name: "icon",
      label: "Icono (kebab-case)",
      type: "text",
      required: false,
      gridCols: 1,
      placeholder: "ej: credit-card",
    },
    {
      name: "sortOrder",
      label: "Orden de Clasificación",
      type: "number",
      required: false,
      gridCols: 1,
      placeholder: "ej: 5",
    },
    {
      name: "isActive",
      label: "Activo por defecto",
      type: "boolean",
      gridCols: 2,
    },
    {
      name: "description",
      label: "Descripción del Módulo",
      type: "textarea",
      gridCols: 2,
      placeholder: "Descripción breve de las características...",
    },
  ], [])

  const handleCreateSubmit = (values: Record<string, any>) => {
    createMutation.mutate(values as any, {
      onSuccess: () => {
        toast.success("Módulo del sistema creado con éxito")
        setIsCreateOpen(false)
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || "Error al crear el módulo"
        toast.error(message)
      },
    })
  }

  const handleEditSubmit = (values: Record<string, any>) => {
    if (!selectedRecord) return

    const patchPayload: Record<string, any> = {}
    Object.keys(values).forEach((key) => {
      const newVal = values[key]
      const oldVal = (selectedRecord as any)[key]
      const isOldFalsy = oldVal === null || oldVal === undefined || oldVal === ""
      const isNewFalsy = newVal === null || newVal === undefined || newVal === ""
      if (isOldFalsy && isNewFalsy) return
      if (newVal !== oldVal) patchPayload[key] = newVal
    })

    if (Object.keys(patchPayload).length === 0) {
      toast.info("No se realizaron cambios")
      setIsEditOpen(false)
      return
    }

    updateMutation.mutate(
      { id: selectedRecord.id, payload: patchPayload },
      {
        onSuccess: () => {
          toast.success("Módulo actualizado con éxito")
          setIsEditOpen(false)
        },
        onError: (err: any) => {
          const message = err.response?.data?.message || "Error al actualizar el módulo"
          toast.error(message)
        },
      }
    )
  }

  const handleDeleteConfirm = () => {
    if (!selectedRecord) return
    deleteMutation.mutate(selectedRecord.id, {
      onSuccess: () => {
        toast.success("Módulo del sistema eliminado con éxito")
        setIsDeleteOpen(false)
      },
      onError: (err: any) => {
        const message = err.response?.data?.message || "Error al eliminar el módulo"
        toast.error(message)
      },
    })
  }

  // Define Table Columns
  const columns: ColumnDef<SystemModule>[] = [
    {
      key: "name",
      header: "Módulo",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0">
            <ModuleIcon name={row.icon} className="h-4 w-4 stroke-[1.5]" />
          </div>
          <span className="font-semibold text-foreground text-xs">{row.name}</span>
        </div>
      ),
    },
    {
      key: "key",
      header: "Llave (Key)",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center text-[10px] font-mono font-bold text-muted-foreground/75 bg-muted/40 px-1.5 py-0.5 rounded border border-border/10">
          {row.key}
        </span>
      ),
    },
    {
      key: "description",
      header: "Descripción",
      render: (row) => (
        <span className="text-muted-foreground/90 truncate max-w-[200px] block text-xs">
          {row.description || <span className="italic text-muted-foreground/45">Sin descripción</span>}
        </span>
      ),
    },
    {
      key: "sortOrder",
      header: "Orden",
      sortable: true,
      render: (row) => <span className="font-medium text-xs">{row.sortOrder}</span>,
    },
    {
      key: "isActive",
      header: "Estado",
      render: (row) => {
        const isPending = row.id in pendingToggles
        const isChecked = isPending ? pendingToggles[row.id] : row.isActive

        return (
          <div className="flex items-center h-5" onClick={(e) => e.stopPropagation()}>
            <Switch
              id={`switch-${row.id}`}
              checked={isChecked}
              onCheckedChange={(checked) => handleStatusToggle(row, checked)}
            />
          </div>
        )
      },
    },
    {
      key: "actions",
      header: "Acciones",
      className: "w-[120px]",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsDetailOpen(true)
            }}
            title="Ver detalles"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsEditOpen(true)
            }}
            title="Editar módulo"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setSelectedRecord(row)
              setIsDeleteOpen(true)
            }}
            title="Eliminar módulo"
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Toolbar: search + create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder="Buscar módulo por nombre o llave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-xs border-border bg-card focus-visible:ring-brand-500 placeholder:text-muted-foreground/50 shadow-sm"
          />
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white rounded-[11px] gap-1.5 flex items-center justify-center px-4 h-10 transition-all duration-150 active:scale-95 cursor-pointer text-xs font-semibold shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Nuevo Módulo
        </button>
      </div>

      {/* Content Area */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50 select-none">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Error al cargar módulos</h3>
            <p className="text-[11px] text-muted-foreground">
              Ocurrió un error al conectar con el servidor.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline cursor-pointer"
          >
            Reintentar consulta
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={paginatedModules}
          loading={isLoading}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyMessage="No se encontraron módulos del sistema."
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: setPage,
            totalItems: sortedModules.length,
            itemsPerPage: itemsPerPage,
          }}
          onRowClick={(row) => {
            setSelectedRecord(row)
            setIsDetailOpen(true)
          }}
          glassy={true}
        />
      )}

      {/* Create Modal */}
      <DynamicFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nuevo Módulo del Sistema"
        description="Agrega un nuevo módulo al catálogo global del sistema."
        fields={createFields}
        submitLabel="Crear Módulo"
        isLoading={createMutation.isPending}
        onSubmit={handleCreateSubmit}
      />

      {/* Edit Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setSelectedRecord(null)
        }}
        title="Editar Módulo del Sistema"
        description="Actualiza las propiedades de este módulo."
        fields={editFields}
        defaultValues={selectedRecord || undefined}
        submitLabel="Guardar Cambios"
        isLoading={updateMutation.isPending}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setSelectedRecord(null)
        }}
        title="¿Eliminar módulo del sistema?"
        description="Esta acción eliminará el módulo, todas sus funcionalidades, permisos asociados y asignaciones a roles. No se puede deshacer."
        confirmLabel="Eliminar"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />

      {/* Detail Viewer Modal */}
      <SystemModulesDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedRecord(null)
        }}
        record={selectedRecord}
      />
    </div>
  )
}
