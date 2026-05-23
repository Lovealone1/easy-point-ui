"use client"

import * as React from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/components/ui/button"

export interface ColumnDef<T> {
  key: keyof T | string
  header: string
  align?: "left" | "center" | "right"
  sortable?: boolean
  render?: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
}

export interface PaginationConfig {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  sortKey?: string
  sortOrder?: "asc" | "desc"
  onSort?: (key: string) => void
  pagination?: PaginationConfig
  onRowClick?: (row: T) => void
  className?: string
  wrapperClassName?: string
  glassy?: boolean
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No se encontraron registros.",
  sortKey,
  sortOrder,
  onSort,
  pagination,
  onRowClick,
  className,
  wrapperClassName,
  glassy = false,
}: DataTableProps<T>) {
  
  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable || !onSort) return
    onSort(key)
  }

  // Generate page numbers to show in pagination (e.g. 1, 2, 3...)
  const pageNumbers = React.useMemo(() => {
    if (!pagination) return []
    const { currentPage, totalPages } = pagination
    const pages: (number | string)[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Always show page 1
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      // Middle pages
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }, [pagination])

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "overflow-hidden border border-border/30 shadow-xs transition-all duration-300",
          glassy ? "glassy-card rounded-2xl" : "rounded-2xl bg-white dark:bg-zinc-950",
          wrapperClassName
        )}
      >
        <Table>
          <TableHeader className="bg-muted/20 dark:bg-muted/10">
            <TableRow className="border-b border-border/30 hover:bg-transparent">
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                const alignClass =
                  col.align === "center"
                    ? "text-center justify-center"
                    : col.align === "right"
                    ? "text-right justify-end"
                    : "text-left justify-start"

                return (
                  <TableHead
                    key={String(col.key)}
                    className={cn(
                      col.sortable && "select-none cursor-pointer hover:text-foreground transition-colors",
                      col.headerClassName
                    )}
                    onClick={() => handleSort(String(col.key), col.sortable)}
                  >
                    <div className={cn("flex items-center gap-1.5", alignClass)}>
                      <span>{col.header}</span>
                      {col.sortable && onSort && (
                        <span className="text-muted-foreground/40 transition-colors group-hover/tablehead:text-muted-foreground/80">
                          {isSorted ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-primary" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white dark:bg-zinc-950">
            {loading ? (
              // Loading Skeleton State
              Array.from({ length: pagination?.itemsPerPage || 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-row-${rowIndex}`} className="hover:bg-transparent">
                  {columns.map((col, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`}>
                      <div className="h-4 w-full animate-pulse rounded-md bg-muted/60" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
                    <Inbox className="h-8 w-8 stroke-1 text-muted-foreground/50 animate-pulse" />
                    <span className="text-xs font-medium">{emptyMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              data.map((row, rowIndex) => (
                <TableRow
                  key={row.id || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "bg-white dark:bg-zinc-950",
                    onRowClick && "cursor-pointer hover:bg-brand-100/15 dark:hover:bg-brand-100/10 transition-colors active:bg-brand-100/25"
                  )}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"

                    return (
                      <TableCell
                        key={String(col.key)}
                        className={cn(alignClass, col.className)}
                      >
                        {col.render
                          ? col.render(row, rowIndex)
                          : row[col.key as string] ?? "-"}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20 dark:bg-muted/10 select-none animate-in fade-in duration-300">
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
              {pagination.totalItems !== undefined && (
                <div>
                  Total de registros: <span className="font-semibold text-foreground">{pagination.totalItems}</span>
                </div>
              )}
              <div>
                Página <span className="font-semibold text-foreground">{pagination.currentPage}</span> de{" "}
                <span className="font-semibold text-foreground">{pagination.totalPages}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1 || loading}
                className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages || loading}
                className="h-8 w-8 rounded-full border border-border/40 bg-white dark:bg-zinc-950 hover:border-border/70 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
