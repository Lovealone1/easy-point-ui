// ─────────────────────────────────────────────────────────────────────────────
// app/(account)/account/profile/page.tsx
//
// "Actualizar datos": name and phone number. The email address is shown but
// not editable here — changing it has to prove control of the new mailbox, so
// it lives behind its own flow at /account/email.
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { PageLoader } from "@/shared/components/ui/spinner"
import { cn } from "@/shared/lib/utils"
import { apiErrorMessage } from "@/shared/utils/api-message"
import { AccountPage, AccountSection } from "@/features/account/components/account-page"
import { useAccountProfile, useUpdateAccountProfile } from "@/features/account/hooks/use-account"

export default function AccountProfilePage() {
  const { data: profile, isLoading } = useAccountProfile()
  const updateMutation = useUpdateAccountProfile()

  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [hydrated, setHydrated] = React.useState(false)

  // Seeded during render rather than in an effect — the repo lints against
  // setState-in-effect, and an effect would flash the empty form first.
  if (profile && !hydrated) {
    setFirstName(profile.firstName ?? "")
    setLastName(profile.lastName ?? "")
    setPhoneNumber(profile.phoneNumber ?? "")
    setHydrated(true)
  }

  if (isLoading || !hydrated || !profile) {
    return <PageLoader label="Cargando tu perfil..." />
  }

  const isDirty =
    firstName !== (profile.firstName ?? "") ||
    lastName !== (profile.lastName ?? "") ||
    phoneNumber !== (profile.phoneNumber ?? "")

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()

    try {
      await updateMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      })
      toast.success("Perfil actualizado")
    } catch (error) {
      toast.error(apiErrorMessage(error, "No se pudo actualizar tu perfil."))
    }
  }

  function handleDiscard() {
    if (!profile) return
    setFirstName(profile.firstName ?? "")
    setLastName(profile.lastName ?? "")
    setPhoneNumber(profile.phoneNumber ?? "")
  }

  return (
    <AccountPage
      title="Perfil"
      description="Tu nombre y tu teléfono. Es lo que ven las personas con las que compartes espacio."
    >
      <form onSubmit={handleSave} className="space-y-6">
        <AccountSection title="Datos personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                Nombre
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={100}
                placeholder="Ana"
                className="h-11 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Apellido
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={100}
                placeholder="Ruiz"
                className="h-11 bg-background"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Teléfono
              </Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={30}
                placeholder="+57 300 123 4567"
                className="h-11 bg-background"
              />
            </div>
          </div>
        </AccountSection>

        <AccountSection
          title="Correo de acceso"
          description="Con este correo entras a Easy Point. Cambiarlo requiere confirmar el nuevo."
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 rounded-lg border border-border/50 bg-muted/40 px-3 h-11">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{profile.email}</span>
            </div>
            {/* A Link styled as a button rather than <Button render={...}>:
                this one navigates, and an anchor is what should carry that. */}
            <Link
              href="/account/email"
              className={cn(buttonVariants({ variant: "outline" }), "h-11 shrink-0 px-4")}
            >
              Cambiar correo
            </Link>
          </div>
        </AccountSection>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={updateMutation.isPending || !isDirty} className="h-11">
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={updateMutation.isPending}
              className="h-11"
            >
              Descartar
            </Button>
          )}
        </div>
      </form>
    </AccountPage>
  )
}
