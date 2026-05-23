"use client"

import * as React from "react"
import { cn } from "@/shared/lib/utils"

export interface DataTableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchSection?: React.ReactNode
  filterSection?: React.ReactNode
  actionSection?: React.ReactNode
}

export function DataTableToolbar({
  searchSection,
  filterSection,
  actionSection,
  className,
  children,
  ...props
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className
      )}
      {...props}
    >
      {/* Search and Filters container (Left/Top) */}
      <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
        {searchSection && (
          <div className="w-full sm:w-auto sm:min-w-[240px] md:min-w-[280px]">
            {searchSection}
          </div>
        )}
        
        {filterSection && (
          <div className="flex flex-wrap items-center gap-2">
            {filterSection}
          </div>
        )}
      </div>

      {/* Actions and Advanced buttons container (Right/Bottom) */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
        {actionSection}
        {children}
      </div>
    </div>
  )
}
