"use client"

import * as React from "react"
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  variant?: "danger" | "warning" | "info"
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isLoading = false,
  variant = "danger",
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
  }

  const iconMap = {
    danger: <Trash2 className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <AlertTriangle className="h-5 w-5" />,
  }

  const colorStyles = {
    danger: {
      iconBg: "bg-rose-500/10 text-rose-500",
      confirmBtn: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white",
    },
    warning: {
      iconBg: "bg-amber-500/10 text-amber-500",
      confirmBtn: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white",
    },
    info: {
      iconBg: "bg-brand-500/10 text-brand-500",
      confirmBtn: "bg-brand-500 hover:bg-brand-600 active:bg-amber-700 text-white",
    },
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm rounded-xl bg-card border border-border/40 shadow-xl p-5 sm:p-6 gap-4 sm:gap-5 duration-200">
        <DialogHeader className="gap-2.5 flex flex-col items-center text-center">
          <div className={cn("p-3 rounded-full mb-1", colorStyles[variant].iconBg)}>
            {iconMap[variant]}
          </div>
          <DialogTitle className="text-lg font-heading font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription
            render={<div className="text-xs text-muted-foreground leading-relaxed max-w-[280px]" />}
          >
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 mt-4 border-t border-border/25 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold border-border/80 cursor-pointer"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all",
              colorStyles[variant].confirmBtn
            )}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
