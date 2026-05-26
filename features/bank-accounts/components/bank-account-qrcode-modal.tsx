"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import {
  useUploadBankAccountQrCode,
  useDeleteBankAccountQrCode,
} from "../hooks/use-bank-accounts"
import type { BankAccount } from "../types/bank-accounts.types"
import { QrCode, Upload, Trash2, Loader2, AlertCircle } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  account: BankAccount | null
}

export function BankAccountQrCodeModal({ isOpen, onClose, account }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  
  const uploadQrMutation = useUploadBankAccountQrCode()
  const deleteQrMutation = useDeleteBankAccountQrCode()

  if (!account) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validations: only webp, jpg, jpeg, png. SVG is explicitly rejected.
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    if (!allowedMimeTypes.includes(file.type)) {
      toast.error("Formato no permitido", {
        description: "Solo se aceptan imágenes de tipo PNG, JPG, JPEG o WEBP. Los archivos SVG no están permitidos.",
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    uploadQrMutation.mutate(
      { id: account.id, file },
      {
        onSuccess: () => {
          toast.success("Código QR subido con éxito")
          if (fileInputRef.current) fileInputRef.current.value = ""
        },
        onError: (err) => {
          toast.error("Error al subir el código QR", {
            description: err instanceof Error ? err.message : "Intente nuevamente.",
          })
          if (fileInputRef.current) fileInputRef.current.value = ""
        },
      }
    )
  }

  const handleDelete = () => {
    deleteQrMutation.mutate(account.id, {
      onSuccess: () => {
        toast.success("Código QR eliminado con éxito")
      },
      onError: (err) => {
        toast.error("Error al eliminar el código QR", {
          description: err instanceof Error ? err.message : "Intente nuevamente.",
        })
      },
    })
  }

  const isPending = uploadQrMutation.isPending || deleteQrMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-4 sm:p-6 gap-5 sm:gap-6 duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold text-foreground">
            Código QR — {account.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground/90 mt-1">
            Visualiza o administra el código QR único para transferencias bancarias directas.
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center py-4 border border-dashed border-border/40 rounded-xl bg-muted/5 min-h-[250px]">
          {account.qrCode ? (
            <div className="flex flex-col items-center gap-4">
              {/* Image box */}
              <div className="relative border border-border/60 bg-white p-2.5 rounded-lg shadow-md max-w-[200px] max-h-[200px] overflow-hidden">
                <img
                  src={account.qrCode}
                  alt={`QR Code ${account.name}`}
                  className="object-contain w-full h-full aspect-square"
                />
              </div>
              <span className="text-xs text-muted-foreground/80 font-mono">
                MIME: PNG / JPG / WEBP
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6 text-muted-foreground">
              <QrCode className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <span className="text-sm font-semibold">Sin código QR asignado</span>
              <span className="text-xs text-muted-foreground/75 mt-1 max-w-[250px]">
                Sube una imagen (PNG, JPG, JPEG o WEBP) para esta cuenta bancaria.
              </span>
            </div>
          )}
        </div>

        {/* File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="hidden"
          disabled={isPending}
        />

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between items-center w-full">
          {account.qrCode ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="w-full sm:w-auto gap-2 text-xs py-1.5 h-9 rounded-lg"
            >
              {deleteQrMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Eliminar QR
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 sm:flex-none text-xs py-1.5 h-9 rounded-lg"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="flex-1 sm:flex-none gap-2 text-xs py-1.5 h-9 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98"
            >
              {uploadQrMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {account.qrCode ? "Cambiar QR" : "Subir QR"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
