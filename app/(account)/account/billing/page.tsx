// ─────────────────────────────────────────────────────────────────────────────
// app/(account)/account/billing/page.tsx
//
// A person's own DIAN electronic-invoicing profile.
//
// This used to be reachable only from the administration console, at
// /admin/user-info/[userId] — which meant the RUT, the tax regime and the DIAN
// resolution of an account, all of which only its owner actually knows, had to
// be typed in by a global administrator. The console keeps its view for
// support; this is the same editor, pointed at /me.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import { PageLoader } from "@/shared/components/ui/spinner"
import { BillingProfileEditor } from "@/features/user-info/components/billing-profile-editor"
import { AccountPage } from "@/features/account/components/account-page"
import {
  useAccountBillingProfile,
  useConfigurePersonaJuridica,
  useConfigurePersonaNatural,
  useDeleteBillingProfile,
} from "@/features/account/hooks/use-account"

export default function AccountBillingPage() {
  const { data: profile, isLoading } = useAccountBillingProfile()

  const configureNatural = useConfigurePersonaNatural()
  const configureJuridica = useConfigurePersonaJuridica()
  const deleteProfile = useDeleteBillingProfile()

  if (isLoading) {
    return <PageLoader label="Cargando tu perfil de facturación..." />
  }

  return (
    <AccountPage
      wide
      title="Facturación electrónica"
      description="Tus datos ante la DIAN: identificación fiscal, régimen, resolución y numeración. Se usan en los documentos que emites."
    >
      <BillingProfileEditor
        profile={profile}
        subjectLabel="tu cuenta"
        configureNatural={configureNatural}
        configureJuridica={configureJuridica}
        deleteProfile={deleteProfile}
      />
    </AccountPage>
  )
}
