"use client"

import * as React from 'react'
import { Download, FileSpreadsheet, FileUp, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/button'
import { usePermissions } from '@/shared/hooks/use-permissions'
import { masterImportsService, type ImportValidationResult } from '../services/master-imports.service'

type Props = { resource: string; label?: string }

function messageFromError(error: unknown): string {
  const response = (error as { response?: { data?: { message?: string | string[] } } })?.response
  const message = response?.data?.message
  return Array.isArray(message) ? message.join(', ') : message || (error instanceof Error ? error.message : 'No se pudo completar la operación')
}

export function MasterImportActions({ resource, label = 'Importar archivo' }: Props) {
  const queryClient = useQueryClient()
  const { can } = usePermissions()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [format, setFormat] = React.useState<'xlsx' | 'csv'>('xlsx')
  const [file, setFile] = React.useState<File | null>(null)
  const [validation, setValidation] = React.useState<ImportValidationResult | null>(null)
  const [busy, setBusy] = React.useState(false)
  const canImport = can(`${resource.replace(/-/g, '_')}:create`)

  const close = (force = false) => {
    if (busy && !force) return
    setOpen(false)
    setFile(null)
    setValidation(null)
  }

  const selectFile = (next: File | null) => {
    setFile(next)
    setValidation(null)
  }

  const validate = async () => {
    if (!file) return
    setBusy(true)
    try {
      setValidation(await masterImportsService.validate(resource, file))
    } catch (error) {
      toast.error('No se pudo validar el archivo', { description: messageFromError(error) })
    } finally {
      setBusy(false)
    }
  }

  const confirm = async () => {
    if (!file || !validation?.valid) return
    setBusy(true)
    try {
      const result = await masterImportsService.import(resource, file, validation.fileHash)
      toast.success('Importación completada', { description: `${result.createdRows} registros creados` })
      await queryClient.invalidateQueries()
      close(true)
    } catch (error) {
      toast.error('No se pudo importar el archivo', { description: messageFromError(error) })
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    try {
      await masterImportsService.downloadTemplate(resource, format)
    } catch (error) {
      toast.error('No se pudo descargar la plantilla', { description: messageFromError(error) })
    }
  }

  const downloadErrors = () => {
    if (!validation?.errors.length) return
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const body = [
      ['fila', 'columna', 'codigo', 'mensaje'],
      ...validation.errors.map((item) => [item.row, item.column ?? '', item.code, item.message]),
    ].map((row) => row.map(escape).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${body}\r\n`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${resource}-errores-importacion.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!canImport) return null

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button variant="outline" size="sm" onClick={() => void download()}>
          <Download className="size-4" />
          <span className="hidden sm:inline">Descargar plantilla</span>
          <span className="sm:hidden">Plantilla</span>
        </Button>
        <Button size="sm" onClick={() => setOpen(true)}>
          <FileUp className="size-4" />
          {label}
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby={`${resource}-import-title`}>
          <div className="w-full max-w-xl rounded-xl bg-background p-5 shadow-xl ring-1 ring-foreground/10">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id={`${resource}-import-title`} className="font-heading text-lg font-semibold">Importar registros</h2>
                <p className="text-sm text-muted-foreground">Carga hasta 1.000 filas. Primero validaremos el archivo y luego podrás confirmar.</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={() => close()} aria-label="Cerrar"><X /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="flex min-h-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border/70 px-4 text-center text-sm text-muted-foreground hover:bg-muted/40">
                <input ref={inputRef} className="sr-only" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
                <span className="flex flex-col items-center gap-1">
                  {file ? <FileSpreadsheet className="size-6 text-primary" /> : <Upload className="size-6" />}
                  <span>{file ? file.name : 'Selecciona un archivo Excel o CSV'}</span>
                  <span className="text-xs">Máximo 10 MB</span>
                </span>
              </label>
              <div className="flex flex-row gap-2 sm:flex-col">
                <Button type="button" variant={format === 'xlsx' ? 'secondary' : 'outline'} size="sm" onClick={() => setFormat('xlsx')}>Excel</Button>
                <Button type="button" variant={format === 'csv' ? 'secondary' : 'outline'} size="sm" onClick={() => setFormat('csv')}>CSV</Button>
              </div>
            </div>
            {validation && (
              <div className={`mt-4 rounded-lg p-3 text-sm ${validation.valid ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-destructive/10 text-destructive'}`}>
                <p className="font-medium">{validation.valid ? `${validation.validRows} filas listas para importar` : `${validation.invalidRows} filas tienen errores`}</p>
                {!validation.valid && <>
                  <ul className="mt-2 max-h-32 list-disc overflow-auto pl-5">{validation.errors.slice(0, 8).map((item) => <li key={`${item.row}-${item.column}-${item.code}`}>Fila {item.row}{item.column ? ` · ${item.column}` : ''}: {item.message}</li>)}</ul>
                  <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2" onClick={downloadErrors}><Download className="size-3" />Descargar reporte de errores</button>
                </>}
              </div>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => close()} disabled={busy}>Cancelar</Button>
              <Button variant="secondary" onClick={() => void validate()} disabled={!file || busy}>{busy && !validation ? <Loader2 className="animate-spin" /> : null}Validar archivo</Button>
              <Button onClick={() => void confirm()} disabled={!validation?.valid || busy}>{busy && validation?.valid ? <Loader2 className="animate-spin" /> : null}Confirmar importación</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
