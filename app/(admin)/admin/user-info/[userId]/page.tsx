"use client"

// ─────────────────────────────────────────────────────────────────────────────
// app/(admin)/admin/user-info/[userId]/page.tsx
//
// The console's view of one account's DIAN invoicing profile — kept for
// support, now that the account holder can edit their own at
// /account/billing. Both render the same editor; only the subject differs.
// ─────────────────────────────────────────────────────────────────────────────

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  useBillingProfile,
  useConfigurePersonaNatural,
  useConfigurePersonaJuridica,
  useDeleteBillingProfile,
} from "@/features/user-info/hooks/use-user-info"
import { BillingProfileEditor } from "@/features/user-info/components/billing-profile-editor"
import { useUser } from "@/features/users/hooks/use-users"
import { Button } from "@/shared/components/ui/button"
import { Spinner } from "@/shared/components/ui/spinner"

interface PageProps {
  params: Promise<{ userId: string }>
}

export default function UserInfoAdminPage({ params }: PageProps) {
  const router = useRouter()
  const { userId } = React.use(params)

  const { data: targetUser, isLoading: isUserLoading } = useUser(userId)
  const { data: profile, isLoading: isProfileLoading } = useBillingProfile(userId)

  const configureNatural = useConfigurePersonaNatural(userId)
  const configureJuridica = useConfigurePersonaJuridica(userId)
  const deleteProfile = useDeleteBillingProfile(userId)

  if (isProfileLoading || isUserLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner size="md" />
        <p className="text-sm text-muted-foreground animate-pulse">Cargando información...</p>
      </div>
    )
  }

  const targetName = targetUser
    ? [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ")
    : ""

  return (
    <div className="w-full space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Configurar Facturación Electrónica DIAN
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/users")}
          className="w-fit flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Usuarios
        </Button>
      </div>

      <BillingProfileEditor
        profile={profile}
        subjectLabel={targetName || targetUser?.email || "este usuario"}
        configureNatural={configureNatural}
        configureJuridica={configureJuridica}
        deleteProfile={deleteProfile}
        onCancel={() => router.push("/admin/users")}
      />
    </div>
  )
}
