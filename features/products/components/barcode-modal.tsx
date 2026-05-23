"use client"

import * as React from "react"
import { Barcode as BarcodeIcon, Copy, Check, Printer, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import JsBarcode from "jsbarcode"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import type { Product } from "../types/products.types"

interface BarcodeModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export function BarcodeModal({ isOpen, onClose, product }: BarcodeModalProps) {
  const [copied, setCopied] = React.useState(false)
  const svgRef = React.useRef<SVGSVGElement | null>(null)

  // Callback ref to guarantee jsbarcode runs immediately when SVG is mounted in the DOM
  const barcodeRef = React.useCallback((node: SVGSVGElement | null) => {
    svgRef.current = node
    if (node && product && product.barcode) {
      try {
        // Simple numeric check for EAN-13 (12 or 13 digits). Fallback to CODE128 for alphanumeric
        const isNumericOnly = /^\d+$/.test(product.barcode)
        const format = (isNumericOnly && (product.barcode.length === 12 || product.barcode.length === 13)) 
          ? "EAN13" 
          : "CODE128"

        JsBarcode(node, product.barcode, {
          format: format,
          width: 2,
          height: 80,
          displayValue: false, // Custom styled text representation rendered below
          margin: 0,
        })
      } catch (err) {
        console.warn("EAN13 barcode generation failed, falling back to CODE128:", err)
        try {
          JsBarcode(node, product.barcode!, {
            format: "CODE128",
            width: 1.8,
            height: 80,
            displayValue: false,
            margin: 0,
          })
        } catch (fallbackErr) {
          console.error("Failed to generate fallback CODE128 barcode:", fallbackErr)
        }
      }
    }
  }, [product])

  if (!product) return null

  const handleCopy = () => {
    if (!product.barcode) return
    navigator.clipboard.writeText(product.barcode)
    setCopied(true)
    toast.success("Código de barras copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    if (!product.barcode || !svgRef.current) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("El navegador bloqueó la ventana emergente. Por favor, permita ventanas emergentes.")
      return
    }

    // Retrieve outer HTML string of rendered SVG for pristine vector output
    const svgHtml = svgRef.current.outerHTML

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Código de Barras - ${product.name}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: white;
              color: black;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .ticket {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 24px;
              border: 2px dashed #94a3b8;
              border-radius: 12px;
              max-width: 320px;
            }
            .name {
              font-size: 16px;
              font-weight: 700;
              margin-bottom: 4px;
              color: #1e293b;
            }
            .sku {
              font-size: 11px;
              font-family: monospace;
              color: #64748b;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .barcode-svg-container {
              display: flex;
              justify-content: center;
              width: 100%;
              max-width: 260px;
              background: white;
              padding: 8px 0;
            }
            .barcode-svg-container svg {
              width: 100%;
              height: auto;
            }
            .code {
              font-family: monospace;
              font-size: 18px;
              font-weight: 700;
              margin-top: 12px;
              letter-spacing: 5px;
              color: #0f172a;
              padding-left: 5px; /* Spacing offset compensation */
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="name">${product.name}</div>
            <div class="sku">SKU: ${product.sku || "N/A"}</div>
            <div class="barcode-svg-container">
              ${svgHtml}
            </div>
            <div class="code">${product.barcode}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xs sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-6 gap-6 duration-200">
        <DialogHeader className="gap-1 flex flex-col items-center text-center">
          <DialogTitle className="text-lg font-heading font-bold text-foreground">
            {product.name}
          </DialogTitle>
          {product.sku && (
            <DialogDescription className="text-xs font-mono text-muted-foreground">
              SKU: {product.sku}
            </DialogDescription>
          )}
        </DialogHeader>

        {product.barcode ? (
          <div className="flex flex-col items-center justify-center p-6 border border-border/40 rounded-lg bg-white text-zinc-950 shadow-inner select-none gap-4">
            <div className="flex flex-col items-center w-full">
              <div className="w-full flex justify-center bg-white p-2 rounded-lg">
                <svg ref={barcodeRef} className="max-h-[100px] max-w-full object-contain" />
              </div>
              <span className="font-mono text-base font-bold tracking-[6px] pl-1.5 mt-2 text-zinc-800">
                {product.barcode}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-amber-500/35 rounded-lg bg-amber-500/5 text-amber-500 text-center gap-2">
            <AlertTriangle className="h-8 w-8 text-amber-500/80 mb-1" />
            <h4 className="font-semibold text-sm">Sin Código de Barras</h4>
            <p className="text-xs text-muted-foreground/80 max-w-[260px]">
              Este producto no tiene un código de barras configurado en la base de datos.
            </p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full mt-2 sm:mt-0">
          {product.barcode && (
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="flex-1 px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold border-border/80 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500 animate-in zoom-in-50" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Código
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handlePrint}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Printer className="h-4 w-4" />
                Imprimir Código
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full px-4 py-2 hover:bg-muted/50 rounded-lg text-xs border-border/80 cursor-pointer sm:hidden"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
