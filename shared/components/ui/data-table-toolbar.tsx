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
          <div className="w-full sm:w-[480px]">
            {searchSection}
          </div>
        )}
        
        {filterSection && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {filterSection}
          </div>
        )}
      </div>

      {/* Actions and Advanced buttons container (Right/Bottom) */}
      <div className="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        {actionSection}
        {children}
      </div>
    </div>
  )
}
