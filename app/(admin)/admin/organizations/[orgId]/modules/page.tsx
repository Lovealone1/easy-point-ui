// ─────────────────────────────────────────────────────────────────────────────
// app/(admin)/admin/organizations/[orgId]/modules/page.tsx
//
// Dynamic Next.js route for managing organization-specific modules.
// Fetches the organization details by ID first, then loads the modules panel.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useOrganizationAdmin } from "@/features/organization/hooks/use-organizations-admin"
import { OrgModulesPanel } from "@/features/organization-modules/components/org-modules-panel"
import { Loader2, ChevronLeft, ShieldAlert } from "lucide-react"

export default function OrgModulesPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  const { data: org, isLoading, error } = useOrganizationAdmin(orgId)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 select-none animate-in fade-in duration-300">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-xs text-muted-foreground font-medium">Cargando datos de la organización...</p>
      </div>
    )
  }

  if (error || !org) {
    const errorMessage = (error as any)?.response?.data?.message || "Organización no encontrada."
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 border border-border/40 rounded-2xl bg-card glassy-card space-y-4 select-none">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground font-heading">Error al cargar organización</h3>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        <button
          onClick={() => router.push("/admin/organizations")}
          className="inline-flex items-center gap-1.5 justify-center px-4 h-9 text-xs font-semibold border border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground rounded-lg transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Volver a organizaciones
        </button>
      </div>
    )
  }

  return <OrgModulesPanel orgId={orgId} orgName={org.name} />
}
