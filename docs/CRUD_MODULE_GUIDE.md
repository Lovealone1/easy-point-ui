# CRUD Module Guide — Easy Point UI

This guide describes the **standard pattern** used to build simple data management modules in `easy-point-ui`.  
Follow each step in order. All code blocks are real examples extracted from the **Products** module.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Step 1 — Types](#3-step-1--types)
4. [Step 2 — Service](#4-step-2--service)
5. [Step 3 — Hooks](#5-step-3--hooks)
6. [Step 4 — Page Layout](#6-step-4--page-layout)
7. [Step 5 — Feature-Specific Modals (optional)](#7-step-5--feature-specific-modals-optional)
8. [Shared UI Components Reference](#8-shared-ui-components-reference)
9. [API Contract Reference](#9-api-contract-reference)
10. [Checklist](#10-checklist)

---

## 1. Architecture Overview

Every module is fully self-contained inside `features/<module>/` and connects to the backend through the BFF proxy.

```
Browser
  └─► Next.js BFF Proxy  (app/api/v1/[...path]/route.ts)
        └─► NestJS Backend
```

Data fetching is powered by **TanStack Query (React Query)**:

- `useQuery` — read data (lists, single records)
- `useMutation` — write data (create, update, delete, custom actions)
- `queryClient.invalidateQueries` — automatic cache invalidation after mutations

---

## 2. Folder Structure

```
features/
└── <module>/
    ├── components/         # Feature-specific modals and UI
    │   └── <module>-detail-modal.tsx
    ├── hooks/
    │   └── use-<module>.ts # All React Query hooks for this feature
    ├── services/
    │   └── <module>.service.ts
    └── types/
        └── <module>.types.ts

app/(dashboard)/<module>/
└── page.tsx                # The page component (table + modals)
```

---

## 3. Step 1 — Types

**File:** `features/<module>/types/<module>.types.ts`

Define four things:
1. The **entity** interface (mirrors the backend response shape)
2. A **FindParams** interface (pagination/filter query params)
3. A **CreateDTO** interface (fields required/optional to create)
4. An **UpdateDTO** type (partial of CreateDTO, minus immutable fields)

```typescript
// Example from: features/products/types/products.types.ts

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  salePrice: number;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  // ... other fields
}

export interface FindProductsParams {
  page?: number;
  limit?: number;
  order?: 'ASC' | 'DESC';
  orderBy?: string;
  search?: string;
  isActive?: boolean;
  // ... any filter the backend supports
}

export interface CreateProductDTO {
  name: string;           // required
  salePrice: number;      // required
  description?: string;   // optional
  // ...
}

// Immutable fields (e.g. sku) are excluded from the update type
export type UpdateProductDTO = Partial<Omit<CreateProductDTO, 'sku'>>;
```

> **Rule:** `UpdateDTO` must be a `Partial<...>` because updates always use `PATCH` — only changed fields are sent.

---

## 4. Step 2 — Service

**File:** `features/<module>/services/<module>.service.ts`

Extend `BaseClientService<Entity, CreateDTO, UpdateDTO>`. The base class provides:

| Method | HTTP | Description |
|---|---|---|
| `getAll(params?)` | `GET /endpoint` | Paginated list |
| `getById(id)` | `GET /endpoint/:id` | Single record |
| `create(payload)` | `POST /endpoint` | Create record |
| `update(id, payload)` | `PATCH /endpoint/:id` | Partial update |
| `delete(id)` | `DELETE /endpoint/:id` | Delete record |

Add **custom methods** for non-standard actions (e.g. toggle, add note, generate report).

```typescript
// Example from: features/products/services/products.service.ts

import { BaseClientService } from "@/shared/services/base-client.service"
import { apiClient } from "@/shared/services/api-client"
import type { Product, CreateProductDTO, UpdateProductDTO } from "../types/products.types"

export class ProductsServiceClass extends BaseClientService<
  Product,
  CreateProductDTO,
  UpdateProductDTO
> {
  constructor() {
    super("/products") // The backend endpoint (without /api/v1)
  }

  // Custom action: PATCH /products/:id/toggle-active
  async toggleActive(id: string, isActive: boolean): Promise<Product> {
    const { data } = await apiClient.patch<Product>(
      `/${this.endpoint}/${id}/toggle-active`,
      { isActive }
    )
    return data
  }

  // Custom action: POST /products/:id/notes
  async addNote(id: string, notes: string): Promise<Product> {
    const { data } = await apiClient.post<Product>(
      `/${this.endpoint}/${id}/notes`,
      { notes }
    )
    return data
  }
}

export const productsService = new ProductsServiceClass()

// For a related resource with no custom methods, reuse BaseClientService directly:
export const productCategoriesService = new BaseClientService<ProductCategory>("/product-categories")
```

> **Note:** Always export a **singleton instance** at the bottom of the file.

---

## 5. Step 3 — Hooks

**File:** `features/<module>/hooks/use-<module>.ts`

Each hook wraps a single operation. The file also exports a **query key factory** — an object of functions that produce type-safe, structured cache keys. This is the only way to invalidate caches correctly.

### Query Key Factory Pattern

```typescript
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: FindProductsParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}
```

### Standard Hook Set

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsService } from "../services/products.service"
import type { FindProductsParams, CreateProductDTO, UpdateProductDTO } from "../types/products.types"

// ─── LIST ──────────────────────────────────────────────────────────
export function useProducts(params: FindProductsParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productsService.getAll(params as Record<string, any>),
    placeholderData: (previousData) => previousData, // smooth pagination, no flash
  })
}

// ─── SINGLE ────────────────────────────────────────────────────────
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,  // don't fetch if id is empty
  })
}

// ─── CREATE ────────────────────────────────────────────────────────
export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductDTO) => productsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

// ─── UPDATE ────────────────────────────────────────────────────────
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductDTO }) =>
      productsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(String(variables.id)) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}

// ─── DELETE ────────────────────────────────────────────────────────
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(String(id)) })
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
    },
  })
}
```

> **Rule:** After every mutation that changes data, **invalidate both** the list keys and the detail key for the affected record.

---

## 6. Step 4 — Page Layout

**File:** `app/(dashboard)/<module>/page.tsx`

The page is a `"use client"` component. It wires everything together.

### Structure (in order)

```
"use client"

1. Import hooks (useQuery/useMutation wrappers)
2. Import column/table components
3. Import modal components (shared + feature-specific)

export default function ModulePage() {
  A. Instantiate mutation hooks
  B. Declare modal open/close state + selectedRecord state
  C. Declare filter state (search, page, sortKey, sortOrder)
  D. Debounce the search input
  E. Call the list query hook with filter state
  F. Build any lookup Maps from related data (e.g. categoryMap)
  G. Define the fields schema (for DynamicFormModal)
  H. Define table columns (ColumnDef[])
  I. Return JSX: toolbar + DataTable + all modal components
}
```

### A. Modal State Management

Each modal gets its own `boolean` state. A single `selectedRecord` state carries the entity being acted on.

```typescript
const [isCreateOpen, setIsCreateOpen] = React.useState(false)
const [isEditOpen, setIsEditOpen]     = React.useState(false)
const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
const [selectedRecord, setSelectedRecord] = React.useState<Product | null>(null)
```

### B. Debounced Search

Always debounce the search string to avoid an API request on every keystroke:

```typescript
const [search, setSearch] = React.useState("")
const [debouncedSearch, setDebouncedSearch] = React.useState("")

React.useEffect(() => {
  const handler = setTimeout(() => setDebouncedSearch(search), 350)
  return () => clearTimeout(handler)
}, [search])

React.useEffect(() => {
  setPage(1) // reset to page 1 when filter changes
}, [debouncedSearch])
```

### C. Field Schema (for DynamicFormModal)

Build the schema inside `useMemo` so it recalculates only when related data changes.  
Each field maps to one of five input types: `"text"`, `"number"`, `"textarea"`, `"select"`, `"boolean"`.

```typescript
const fields = React.useMemo<FormFieldSchema[]>(() => [
  { name: "name",     label: "Name",        type: "text",   required: true,  gridCols: 2 },
  { name: "price",    label: "Price",       type: "number", required: true,  gridCols: 1 },
  { name: "category", label: "Category",    type: "select", required: false, gridCols: 1,
    options: categoriesResponse?.data.map(c => ({ label: c.name, value: c.id })) || [] },
  { name: "isActive", label: "Active",      type: "boolean", gridCols: 1 },
  { name: "notes",    label: "Description", type: "textarea", gridCols: 2 },
], [categoriesResponse])
```

> **`gridCols: 2`** makes the field span the full row on desktop. `gridCols: 1` gives it a half-width slot.

### D. Column Definitions

```typescript
const columns: ColumnDef<Product>[] = [
  {
    key: "name",
    header: "Product",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-foreground">{row.name}</span>
    ),
  },
  {
    key: "isActive",
    header: "Status",
    render: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
        row.isActive
          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
      }`}>
        {row.isActive ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    className: "w-[120px]",
    render: (row) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { setSelectedRecord(row); setIsEditOpen(true) }}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-90 cursor-pointer">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => { setSelectedRecord(row); setIsDeleteOpen(true) }}
          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    ),
  },
]
```

> **Important:** Always call `e.stopPropagation()` on the actions wrapper `<div>` to prevent triggering the `onRowClick` handler on the row.

### E. Dirty-Field Diffing on Edit (PATCH)

Only send fields that actually changed to keep `PATCH` requests minimal:

```typescript
onSubmit={(values) => {
  if (!selectedRecord) return

  const patchPayload: Record<string, any> = {}
  Object.keys(values).forEach((key) => {
    const newVal = values[key]
    const oldVal = (selectedRecord as any)[key]
    const isOldFalsy = oldVal === null || oldVal === undefined || oldVal === ""
    const isNewFalsy = newVal === null || newVal === undefined || newVal === ""
    if (isOldFalsy && isNewFalsy) return  // both "empty" — no change
    if (newVal !== oldVal) patchPayload[key] = newVal
  })

  if (Object.keys(patchPayload).length === 0) {
    toast.info("No changes were made")
    setIsEditOpen(false)
    return
  }

  updateMutation.mutate({ id: selectedRecord.id, payload: patchPayload }, {
    onSuccess: () => { toast.success("Updated successfully"); setIsEditOpen(false) },
    onError: () => toast.error("Update failed"),
  })
}}
```

### F. Full JSX Return

```tsx
return (
  <div className="space-y-4">
    {/* Toolbar: search + create button */}
    <DataTableToolbar
      searchSection={
        <DataTableSearch value={search} onChange={setSearch}
          placeholder="Search..." shortcutKey="/" shape="md" />
      }
      actionSection={
        <DataTableAction actionType="create" label="New Record" shape="md"
          onClick={() => setIsCreateOpen(true)} />
      }
    />

    {/* Data Table */}
    <DataTable
      columns={columns}
      data={response?.data || []}
      loading={isLoading}
      sortKey={sortKey}
      sortOrder={sortOrder}
      onSort={handleSort}
      pagination={{
        currentPage: page,
        totalPages: response?.meta?.pageCount || 1,
        onPageChange: setPage,
        totalItems: response?.meta?.itemCount || 0,
        itemsPerPage: 8,
      }}
      onRowClick={(row) => { setSelectedRecord(row); setIsDetailsOpen(true) }}
      glassy={true}
    />

    {/* Modals */}
    <DynamicFormModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}
      title="New Record" fields={fields} submitLabel="Create"
      isLoading={createMutation.isPending}
      onSubmit={(values) => createMutation.mutate(values as any, { ... })} />

    <DynamicFormModal isOpen={isEditOpen}
      onClose={() => { setIsEditOpen(false); setSelectedRecord(null) }}
      title="Edit Record" fields={fields} defaultValues={selectedRecord || undefined}
      submitLabel="Save Changes" isLoading={updateMutation.isPending}
      onSubmit={...} />

    <ConfirmModal isOpen={isDeleteOpen}
      onClose={() => { setIsDeleteOpen(false); setSelectedRecord(null) }}
      title="Delete record?" description="This action cannot be undone."
      confirmLabel="Delete" isLoading={deleteMutation.isPending}
      onConfirm={() => deleteMutation.mutate(selectedRecord!.id, { ... })} />
  </div>
)
```

---

## 7. Step 5 — Feature-Specific Modals (optional)

For read-only views or complex specialized actions (e.g., displaying a barcode, viewing a detailed breakdown), create a dedicated modal component inside `features/<module>/components/`.

**When to create one:** When `DynamicFormModal` or `ConfirmModal` cannot describe the UI you need.

### Template

```tsx
// features/<module>/components/<module>-detail-modal.tsx
"use client"

import * as React from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import type { MyEntity } from "../types/<module>.types"

interface Props {
  isOpen: boolean
  onClose: () => void
  record: MyEntity | null
}

export function MyEntityDetailModal({ isOpen, onClose, record }: Props) {
  if (!record) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">{record.name}</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
          {/* ... */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-lg text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Barcode / Async DOM Mounting Gotcha

If a component inside a modal **requires a DOM node to be present before running logic** (e.g., `jsbarcode` on an `<svg>`), do **not** use `useEffect`. Use a **callback ref** instead:

```tsx
// useEffect will fail — the SVG may not be in the DOM yet when the effect runs
// ❌ DO NOT DO THIS:
React.useEffect(() => {
  if (svgRef.current) JsBarcode(svgRef.current, code, options)
}, [isOpen])

// ✅ DO THIS — callback ref fires immediately when the node mounts:
const barcodeRef = React.useCallback((node: SVGSVGElement | null) => {
  if (node && code) {
    JsBarcode(node, code, { format: "CODE128", height: 80, displayValue: false })
  }
}, [code])

// Usage:
<svg ref={barcodeRef} className="max-h-[100px] max-w-full" />
```

---

## 8. Shared UI Components Reference

| Component | Location | Purpose |
|---|---|---|
| `DataTable` | `shared/components/ui/data-table` | Sortable, paginated table |
| `DataTableToolbar` | `shared/components/ui/data-table-toolbar` | Search + action button row |
| `DataTableSearch` | `shared/components/ui/data-table-search` | Debounced search input |
| `DataTableAction` | `shared/components/ui/data-table-action` | Primary CTA button (create/export) |
| `DynamicFormModal` | `shared/components/ui/dynamic-form-modal` | Schema-driven create/edit modal |
| `ConfirmModal` | `shared/components/ui/confirm-modal` | Confirmation dialog (danger/warning/info) |
| `AddNotesModal` | `shared/components/ui/add-notes-modal` | Administrative notes textarea modal |
| `Dialog` / `DialogContent` | `shared/components/ui/dialog` | Base modal primitive |

### DynamicFormModal Field Types

| `type` value | Rendered as |
|---|---|
| `"text"` | `<Input type="text">` |
| `"number"` | `<Input>` with numeric validation |
| `"textarea"` | `<Textarea>` |
| `"select"` | `<Select>` dropdown |
| `"boolean"` | Animated toggle switch |

---

## 9. API Contract Reference

All responses from the NestJS backend conform to these shared types (`shared/types/api.types.ts`):

```typescript
// Single resource response
interface NestApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

// Paginated list response
interface PaginatedApiResponse<T> {
  data: T[];
  meta: PageMeta;
  statusCode: number;
}

interface PageMeta {
  page: number;
  limit: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

### HTTP Method Rules

| Operation | Method | Notes |
|---|---|---|
| Fetch list | `GET` | Supports query params for pagination/filters |
| Fetch single | `GET /:id` | |
| Create | `POST` | Full DTO body |
| Update | **`PATCH /:id`** | **Only modified fields** |
| Delete | `DELETE /:id` | |
| Custom action | `PATCH /:id/action` or `POST /:id/action` | See service docs |

> ⚠️ **Never use `PUT` for updates.** The backend uses `PATCH` routes exclusively. Sending a `PUT` to an update endpoint will return `404 Not Found`.

---

## 10. Checklist

Use this when implementing a new module:

```
Types
  [ ] Entity interface defined
  [ ] FindParams interface defined
  [ ] CreateDTO interface defined
  [ ] UpdateDTO type defined (Partial<Omit<CreateDTO, 'immutableFields'>>)

Service
  [ ] Class extends BaseClientService<Entity, CreateDTO, UpdateDTO>
  [ ] constructor calls super("/endpoint")
  [ ] Singleton exported at the bottom
  [ ] Custom actions added as needed (PATCH /endpoint/:id/custom-action)

Hooks
  [ ] Query key factory exported
  [ ] useList hook with placeholderData
  [ ] useCreate mutation with list invalidation
  [ ] useUpdate mutation with list + detail invalidation
  [ ] useDelete mutation with list + detail invalidation
  [ ] Custom hooks added as needed

Page
  [ ] Mutation hooks instantiated
  [ ] Modal open/close states declared
  [ ] selectedRecord state declared
  [ ] Debounced search implemented
  [ ] List query called with filter state
  [ ] Field schema defined in useMemo
  [ ] Column definitions include actions column with stopPropagation
  [ ] Dirty-field diffing implemented in edit submit handler
  [ ] DynamicFormModal wired for create
  [ ] DynamicFormModal wired for edit (with defaultValues)
  [ ] ConfirmModal wired for delete
  [ ] DataTable receives pagination object
  [ ] DataTableToolbar with search + create action
```
