// ─────────────────────────────────────────────────────────────────────────────
// features/system-modules/components/system-modules-detail-modal.tsx
//
// Read-only modal displaying detailed information about a System Module,
// including its complete features and permissions hierarchy.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Puzzle } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { SystemModule } from "../types/system-modules.types"

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

interface SystemModulesDetailModalProps {
  isOpen: boolean
  onClose: () => void
  record: SystemModule | null
}

export function SystemModulesDetailModal({
  isOpen,
  onClose,
  record,
}: SystemModulesDetailModalProps) {
  if (!record) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-xl rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold flex items-center gap-2">
            Detalles del Módulo del Sistema
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6 text-left">
          {/* Module Base Info */}
          <div className="flex items-start gap-4 p-4 border border-border/40 rounded-xl bg-muted/5">
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shrink-0 mt-0.5">
              <ModuleIcon name={record.icon} className="h-6 w-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-foreground truncate">{record.name}</h4>
                <span className="inline-flex items-center text-[10px] font-mono font-bold text-muted-foreground/75 bg-muted/40 px-1.5 py-0.5 rounded border border-border/10">
                  {record.key}
                </span>
                {record.isActive ? (
                  <span className="inline-flex items-center text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded uppercase">
                    Inactivo
                  </span>
                )}
              </div>
              {record.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{record.description}</p>
              )}
              <div className="text-[10px] text-muted-foreground/80">
                Orden de clasificación: <span className="font-semibold text-foreground">{record.sortOrder}</span>
              </div>
            </div>
          </div>

          {/* Features & Permissions Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground font-heading uppercase tracking-wider">
              Funcionalidades y Permisos
            </h4>

            {!record.features || record.features.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center border border-dashed border-border/45 rounded-xl bg-muted/5">
                Este módulo no tiene funcionalidades registradas.
              </p>
            ) : (
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 no-scrollbar">
                {record.features.map((feature) => (
                  <div
                    key={feature.id}
                    className="p-4 border border-border/20 rounded-xl bg-muted/5 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-border/10 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground font-heading">
                          {feature.name}
                        </span>
                        <span className="block text-[9px] font-mono text-muted-foreground">
                          {feature.key}
                        </span>
                      </div>
                      {feature.isActive ? (
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Activa
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          Inactiva
                        </span>
                      )}
                    </div>
                    {feature.description && (
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {feature.description}
                      </p>
                    )}

                    {/* Permissions list inside feature */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block">
                        Permisos:
                      </span>
                      {!feature.permissions || feature.permissions.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground italic">
                          Sin permisos definidos.
                        </span>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {feature.permissions.map((perm) => (
                            <div
                              key={perm.id}
                              className="p-2 border border-border/10 rounded-lg bg-card/50 flex flex-col justify-between gap-1 text-left"
                            >
                              <div>
                                <span
                                  className="block text-[11px] font-bold text-foreground truncate"
                                  title={perm.name}
                                >
                                  {perm.name}
                                </span>
                                <span className="block text-[9px] font-mono text-muted-foreground/75 truncate mt-0.5">
                                  {perm.key}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1.5 mt-1 border-t border-border/5 pt-1.5 text-[8px]">
                                <span className="font-bold text-brand-500 uppercase">{perm.type}</span>
                                {perm.isActive ? (
                                  <span className="text-emerald-500 font-bold">Activo</span>
                                ) : (
                                  <span className="text-rose-500 font-bold">Inactivo</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-lg text-xs">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
