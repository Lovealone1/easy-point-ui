"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  User as UserIcon,
  Building,
  FileText,
  Trash2,
  Save,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowLeft,
  Briefcase,
  Mail,
  MapPin,
  Lock,
  Loader2
} from "lucide-react"

import { useBillingProfile, useConfigurePersonaNatural, useConfigurePersonaJuridica, useDeleteBillingProfile } from "@/features/user-info/hooks/use-user-info"
import { useUser } from "@/features/users/hooks/use-users"
import type { PersonaNaturalBilling, PersonaJuridicaBilling } from "@/features/user-info/types/user-info.types"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { toast } from "@/shared/utils/toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/components/ui/select"
import { DatePicker } from "@/shared/components/ui/date-picker"
import { ConfirmModal } from "@/shared/components/ui/confirm-modal"

const DEPARTMENTS = {
  "Bogotá D.C.": ["Bogotá"],
  "Antioquia": ["Medellín", "Envigado", "Bello", "Itagüí", "Rionegro", "Sabaneta"],
  "Valle del Cauca": ["Cali", "Palmira", "Tuluá", "Buga", "Yumbo", "Cartago"],
  "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia"],
  "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"],
  "Cundinamarca": ["Soacha", "Chía", "Zipaquirá", "Facatativá", "Fusagasugá"],
  "Bolívar": ["Cartagena", "Magangué", "Turbaco"],
}

const FISCAL_RESPONSIBILITIES = [
  { code: "O-13", label: "O-13 Gran contribuyente" },
  { code: "O-15", label: "O-15 Autorretenedor" },
  { code: "O-23", label: "O-23 Agente retenedor IVA" },
  { code: "O-47", label: "O-47 Régimen Simple de Tributación" },
  { code: "R-99-PN", label: "R-99-PN No responsable de IVA" }
]

const FISCAL_RESPONSIBILITIES_JURIDICA = [
  { code: "O-13", label: "O-13 Gran contribuyente" },
  { code: "O-15", label: "O-15 Autorretenedor" },
  { code: "O-23", label: "O-23 Agente retenedor IVA" },
  { code: "O-47", label: "O-47 Régimen Simple de Tributación" },
  { code: "R-99-000", label: "R-99-000 Régimen Ordinario" }
]

interface PageProps {
  params: Promise<{ userId: string }>
}

export default function UserInfoAdminPage({ params }: PageProps) {
  const router = useRouter()
  const { userId } = React.use(params)

  const { data: targetUser, isLoading: isUserLoading } = useUser(userId)
  const { data: profile, isLoading: isProfileLoading } = useBillingProfile(userId)

  const naturalData = profile?.type === "NATURAL" ? (profile.data as PersonaNaturalBilling) : null;
  const juridicaData = profile?.type === "JURIDICA" ? (profile.data as PersonaJuridicaBilling) : null;
  const sharedData = profile?.data as any;
  
  const configureNatural = useConfigurePersonaNatural(userId)
  const configureJuridica = useConfigurePersonaJuridica(userId)
  const deleteProfile = useDeleteBillingProfile(userId)

  const [activeTab, setActiveTab] = useState<"NATURAL" | "JURIDICA">("NATURAL")
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [department, setDepartment] = useState("")
  const [municipalities, setMunicipalities] = useState<string[]>([])
  const [municipality, setMunicipality] = useState("")

  // Persona Natural Form State
  const [natTipoDoc, setNatTipoDoc] = useState("CC")
  const [natNumDoc, setNatNumDoc] = useState("")
  const [natNombre, setNatNombre] = useState("")
  const [natApellido, setNatApellido] = useState("")
  const [natNacionalidad, setNatNacionalidad] = useState("Nacional")
  const [natSelectedResp, setNatSelectedResp] = useState<string[]>([])
  const [natRegimenTrib, setNatRegimenTrib] = useState("No responsable de IVA")
  const [natRegimenIva, setNatRegimenIva] = useState("No responsable de IVA")
  const [natEmail, setNatEmail] = useState("")
  const [natDireccion, setNatDireccion] = useState("")
  const [natFirma, setNatFirma] = useState("firma_digital_autorizada.pfx")
  const [natModo, setNatModo] = useState("Facturación Gratuita DIAN")
  const [natPrefijo, setNatPrefijo] = useState("INV")
  const [natDesde, setNatDesde] = useState("1")
  const [natHasta, setNatHasta] = useState("10000")
  const [natResolucion, setNatResolucion] = useState("")
  const [natFechaResolucion, setNatFechaResolucion] = useState<Date | null>(null)
  const [natFechaVigencia, setNatFechaVigencia] = useState<Date | null>(null)

  // Persona Juridica Form State
  const [jurNit, setJurNit] = useState("")
  const [jurDv, setJurDv] = useState("")
  const [jurRazonSocial, setJurRazonSocial] = useState("")
  const [jurTipoOrg, setJurTipoOrg] = useState("S.A.S.")
  const [jurCiiu, setJurCiiu] = useState("")
  const [jurRepTipoDoc, setJurRepTipoDoc] = useState("CC")
  const [jurRepNumDoc, setJurRepNumDoc] = useState("")
  const [jurRepNombres, setJurRepNombres] = useState("")
  const [jurRepApellidos, setJurRepApellidos] = useState("")
  const [jurRepEmail, setJurRepEmail] = useState("")
  const [jurSelectedResp, setJurSelectedResp] = useState<string[]>([])
  const [jurRegimenTrib, setJurRegimenTrib] = useState("Régimen Ordinario")
  const [jurRegimenIva, setJurRegimenIva] = useState("Responsable de IVA")
  const [jurEmail, setJurEmail] = useState("")
  const [jurDireccion, setJurDireccion] = useState("")
  const [jurFirma, setJurFirma] = useState("firma_digital_autorizada.pfx")
  const [jurModo, setJurModo] = useState("Proveedor Tecnológico")
  const [jurPrefijo, setJurPrefijo] = useState("INV")
  const [jurDesde, setJurDesde] = useState("1")
  const [jurHasta, setJurHasta] = useState("50000")
  const [jurResolucion, setJurResolucion] = useState("")
  const [jurFechaResolucion, setJurFechaResolucion] = useState<Date | null>(null)
  const [jurFechaVigencia, setJurFechaVigencia] = useState<Date | null>(null)

  const handleDepartmentChange = (val: string) => {
    setDepartment(val)
    const list = DEPARTMENTS[val as keyof typeof DEPARTMENTS] || []
    setMunicipalities(list)
    setMunicipality(list[0] || "")
  }

  const handleNatRespToggle = (code: string) => {
    setNatSelectedResp(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleJurRespToggle = (code: string) => {
    setJurSelectedResp(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleNatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!natNumDoc || !natNombre || !natApellido || !natEmail || !natDireccion || !department || !municipality || !natResolucion || !natFechaResolucion || !natFechaVigencia) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }

    try {
      await configureNatural.mutateAsync({
        tipoDocumento: natTipoDoc,
        numeroDocumento: natNumDoc,
        primerNombre: natNombre,
        primerApellido: natApellido,
        tipoPersonaNacionalidad: natNacionalidad,
        responsabilidadesFiscales: natSelectedResp.join(", ") || "R-99-PN",
        regimenTributario: natRegimenTrib,
        regimenFiscalIva: natRegimenIva,
        correoElectronicoRut: natEmail,
        direccion: natDireccion,
        departamento: department,
        municipio: municipality,
        certificadoFirma: natFirma,
        modoOperacion: natModo,
        prefijoNumeracion: natPrefijo,
        rangoDesde: parseInt(natDesde),
        rangoHasta: parseInt(natHasta),
        resolucionDian: natResolucion,
        fechaResolucion: natFechaResolucion.toISOString(),
        fechaVigencia: natFechaVigencia.toISOString(),
      })
      toast.success("Perfil de Facturación (Persona Natural) configurado con éxito.")
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Error al configurar el perfil de facturación")
    }
  }

  const handleJurSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jurNit || !jurDv || !jurRazonSocial || !jurCiiu || !jurRepNumDoc || !jurRepNombres || !jurRepApellidos || !jurRepEmail || !jurEmail || !jurDireccion || !department || !municipality || !jurResolucion || !jurFechaResolucion || !jurFechaVigencia) {
      toast.error("Por favor completa todos los campos obligatorios")
      return
    }

    try {
      await configureJuridica.mutateAsync({
        tipoDocumento: "NIT",
        numeroNit: jurNit,
        digitoVerificacion: jurDv,
        razonSocial: jurRazonSocial,
        tipoOrganizacion: jurTipoOrg,
        codigoCiiu: jurCiiu,
        repLegalTipoDoc: jurRepTipoDoc,
        repLegalNumeroDoc: jurRepNumDoc,
        repLegalNombres: jurRepNombres,
        repLegalApellidos: jurRepApellidos,
        repLegalEmail: jurRepEmail,
        responsabilidadesFiscales: jurSelectedResp.join(", ") || "R-99-000",
        regimenTributario: jurRegimenTrib,
        regimenFiscalIva: jurRegimenIva,
        correoElectronicoRut: jurEmail,
        direccion: jurDireccion,
        departamento: department,
        municipio: municipality,
        certificadoFirma: jurFirma,
        modoOperacion: jurModo,
        prefijoNumeracion: jurPrefijo,
        rangoDesde: parseInt(jurDesde),
        rangoHasta: parseInt(jurHasta),
        resolucionDian: jurResolucion,
        fechaResolucion: jurFechaResolucion.toISOString(),
        fechaVigencia: jurFechaVigencia.toISOString(),
      })
      toast.success("Perfil de Facturación (Persona Jurídica) configurado con éxito.")
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Error al configurar el perfil de facturación")
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteProfile.mutateAsync()
      toast.success("Perfil de facturación eliminado exitosamente.")
      setIsDeleteOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Error al eliminar el perfil")
    }
  }

  if (isProfileLoading || isUserLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Cargando información...</p>
      </div>
    )
  }

  const targetName = targetUser ? [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") : ""

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

      {profile ? (
        /* Render Active Configuration Card */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-border/50 bg-card/65 backdrop-blur-xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    {profile.type === "NATURAL" ? <UserIcon className="h-6 w-6" /> : <Building className="h-6 w-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      {profile.type === "NATURAL" ? "Persona Natural Registrada" : "Persona Jurídica Registrada"}
                      <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Activo
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Esta información se vincula automáticamente en las transacciones de {targetName || targetUser?.email}.
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                  className="flex items-center gap-1.5 cursor-pointer hover:bg-destructive/90 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar Configuración
                </Button>
              </div>

              {/* Dynamic Details Render */}
              <div className="grid gap-6 md:grid-cols-2 text-sm border-t border-border/40 pt-6">
                {profile.type === "NATURAL" && naturalData ? (
                  <>
                    <div className="space-y-3.5">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" /> Identificación Fiscal
                      </h3>
                      <div className="space-y-2 font-mono text-xs">
                        <div><strong>Tipo de Documento:</strong> {naturalData.tipoDocumento}</div>
                        <div><strong>Número Documento:</strong> {naturalData.numeroDocumento}</div>
                        <div><strong>Nombres:</strong> {naturalData.primerNombre}</div>
                        <div><strong>Apellidos:</strong> {naturalData.primerApellido}</div>
                        <div><strong>Nacionalidad:</strong> {naturalData.tipoPersonaNacionalidad}</div>
                      </div>
                    </div>
                    <div className="space-y-3.5">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Tributos & Contacto
                      </h3>
                      <div className="space-y-2 font-mono text-xs">
                        <div><strong>Responsabilidades:</strong> {naturalData.responsabilidadesFiscales}</div>
                        <div><strong>Régimen Tributario:</strong> {naturalData.regimenTributario}</div>
                        <div><strong>Correo RUT:</strong> {naturalData.correoElectronicoRut}</div>
                        <div><strong>Dirección:</strong> {naturalData.direccion}</div>
                        <div><strong>Ciudad:</strong> {naturalData.municipio}, {naturalData.departamento}</div>
                      </div>
                    </div>
                  </>
                ) : juridicaData ? (
                  <>
                    <div className="space-y-3.5">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5" /> Razón Social & NIT
                      </h3>
                      <div className="space-y-2 font-mono text-xs">
                        <div><strong>Razón Social:</strong> {juridicaData.razonSocial}</div>
                        <div><strong>NIT:</strong> {juridicaData.numeroNit}-{juridicaData.digitoVerificacion}</div>
                        <div><strong>Organización:</strong> {juridicaData.tipoOrganizacion}</div>
                        <div><strong>Código CIIU principal:</strong> {juridicaData.codigoCiiu}</div>
                        <div><strong>Responsabilidades:</strong> {juridicaData.responsabilidadesFiscales}</div>
                      </div>
                    </div>
                    <div className="space-y-3.5">
                      <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" /> Rep. Legal & Contacto
                      </h3>
                      <div className="space-y-2 font-mono text-xs">
                        <div><strong>Representante:</strong> {juridicaData.repLegalNombres} {juridicaData.repLegalApellidos} ({juridicaData.repLegalTipoDoc} {juridicaData.repLegalNumeroDoc})</div>
                        <div><strong>Email Rep:</strong> {juridicaData.repLegalEmail}</div>
                        <div><strong>Correo RUT:</strong> {juridicaData.correoElectronicoRut}</div>
                        <div><strong>Dirección:</strong> {juridicaData.direccion}</div>
                        <div><strong>Ciudad:</strong> {juridicaData.municipio}, {juridicaData.departamento}</div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Shared Resolution Block */}
              <div className="border-t border-border/40 pt-6 space-y-3.5">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Resolución de Numeración Autorizada DIAN
                </h3>
                <div className="grid gap-4 sm:grid-cols-3 font-mono text-xs bg-muted/20 border border-border/40 p-4 rounded-xl">
                  <div><strong>Resolución:</strong> {sharedData?.resolucionDian}</div>
                  <div><strong>Prefijo:</strong> {sharedData?.prefijoNumeracion}</div>
                  <div><strong>Rango Autorizado:</strong> {sharedData?.rangoDesde} a {sharedData?.rangoHasta}</div>
                  <div><strong>Modo Operación:</strong> {sharedData?.modoOperacion}</div>
                  <div><strong>Fecha Resolución:</strong> {sharedData?.fechaResolucion ? new Date(sharedData.fechaResolucion).toLocaleDateString() : ""}</div>
                  <div><strong>Vigencia hasta:</strong> {sharedData?.fechaVigencia ? new Date(sharedData.fechaVigencia).toLocaleDateString() : ""}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Render Billing Config Switcher and Forms */
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 text-blue-400 text-xs flex gap-2.5 items-start">
            <Lock className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Regla de negocio:</strong> De acuerdo con los lineamientos de la plataforma, si este usuario planea adquirir o pagar suscripciones a planes <strong>Premium</strong>, es obligatorio que completes su perfil de facturación. Solo puedes configurar <strong>un único perfil</strong> por cuenta de usuario.
            </div>
          </div>

          {/* Type Switcher Selector Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setActiveTab("NATURAL")}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                activeTab === "NATURAL"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-border/80 bg-card/40"
              }`}
            >
              <div className={`p-3 rounded-xl border ${activeTab === "NATURAL" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}`}>
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Persona Natural</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Responsable de facturar por cuenta propia (comerciante independiente, profesional libre o contratista).
                </p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("JURIDICA")}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all duration-200 cursor-pointer ${
                activeTab === "JURIDICA"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-border/80 bg-card/40"
              }`}
            >
              <div className={`p-3 rounded-xl border ${activeTab === "JURIDICA" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"}`}>
                <Building className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Persona Jurídica</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Empresa legalmente constituida (sociedades de tipo S.A.S, S.A, Limitadas, ESAL, cooperativas o fundaciones).
                </p>
              </div>
            </button>
          </div>

          {/* Dynamic Billing Config Form */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-lg p-6 md:p-8 relative">
            <h2 className="text-base font-semibold border-b border-border pb-4 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Formulario de Registro — {activeTab === "NATURAL" ? "Persona Natural" : "Persona Jurídica"}
            </h2>

            <form onSubmit={activeTab === "NATURAL" ? handleNatSubmit : handleJurSubmit} className="space-y-6">
              {activeTab === "NATURAL" ? (
                /* ── PERSONA NATURAL FORM ────────────────────────────────────────── */
                <div className="space-y-6">
                  {/* Identificación */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datos de Identificación</h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label>Tipo Documento *</Label>
                        <Select value={natTipoDoc} onValueChange={(val) => setNatTipoDoc(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CC">Cédula de Ciudadanía (CC)</SelectItem>
                            <SelectItem value="CE">Cédula de Extranjería (CE)</SelectItem>
                            <SelectItem value="PA">Pasaporte (PA)</SelectItem>
                            <SelectItem value="NIT">NIT (Actividad comercial propia)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="natNumDoc">Número Documento *</Label>
                        <Input
                          id="natNumDoc"
                          value={natNumDoc}
                          onChange={(e) => setNatNumDoc(e.target.value)}
                          placeholder="Ingresa el número de documento"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="natNombre">Primer Nombre *</Label>
                        <Input
                          id="natNombre"
                          value={natNombre}
                          onChange={(e) => setNatNombre(e.target.value)}
                          placeholder="Primer nombre"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="natApellido">Primer Apellido *</Label>
                        <Input
                          id="natApellido"
                          value={natApellido}
                          onChange={(e) => setNatApellido(e.target.value)}
                          placeholder="Primer apellido"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label>Nacionalidad *</Label>
                        <Select value={natNacionalidad} onValueChange={(val) => setNatNacionalidad(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nacional">Nacional</SelectItem>
                            <SelectItem value="Extranjero">Extranjero</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Tributos */}
                  <div className="space-y-4 border-t border-border/40 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Régimen & Responsabilidades Fiscales RUT</h3>
                    
                    <div className="space-y-2">
                      <Label>Responsabilidades Fiscales (Selecciona las aplicables) *</Label>
                      <div className="grid gap-2 sm:grid-cols-2 mt-1">
                        {FISCAL_RESPONSIBILITIES.map((r) => (
                          <label
                            key={r.code}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              natSelectedResp.includes(r.code)
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border bg-background/30 text-muted-foreground hover:bg-background/55"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={natSelectedResp.includes(r.code)}
                              onChange={() => handleNatToggle(r.code)}
                              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span>{r.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Régimen Tributario *</Label>
                        <Select value={natRegimenTrib} onValueChange={(val) => setNatRegimenTrib(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No responsable de IVA">No responsable de IVA</SelectItem>
                            <SelectItem value="Régimen Común">Régimen Común</SelectItem>
                            <SelectItem value="Régimen Simple de Tributación">Régimen Simple de Tributación</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Régimen Fiscal IVA *</Label>
                        <Select value={natRegimenIva} onValueChange={(val) => setNatRegimenIva(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No responsable de IVA">No responsable de IVA</SelectItem>
                            <SelectItem value="Responsable de IVA">Responsable de IVA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── PERSONA JURIDICA FORM ───────────────────────────────────────── */
                <div className="space-y-6">
                  {/* Identificación */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identificación Tributaria de la Empresa</h3>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="sm:col-span-3">
                        <Label htmlFor="jurNit">Número NIT (Sin dígito de verificación) *</Label>
                        <Input
                          id="jurNit"
                          value={jurNit}
                          onChange={(e) => setJurNit(e.target.value)}
                          placeholder="ej: 901234567"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jurDv">Dígito Verificación *</Label>
                        <Input
                          id="jurDv"
                          value={jurDv}
                          onChange={(e) => setJurDv(e.target.value)}
                          placeholder="0-9"
                          maxLength={1}
                          className="mt-1 bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor="jurRazonSocial">Razón Social *</Label>
                        <Input
                          id="jurRazonSocial"
                          value={jurRazonSocial}
                          onChange={(e) => setJurRazonSocial(e.target.value)}
                          placeholder="Nombre comercial registrado en Cámara de Comercio"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label>Organización Jurídica *</Label>
                        <Select value={jurTipoOrg} onValueChange={(val) => setJurTipoOrg(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S.A.S.">S.A.S.</SelectItem>
                            <SelectItem value="S.A.">S.A.</SelectItem>
                            <SelectItem value="Ltda.">Limitada (Ltda.)</SelectItem>
                            <SelectItem value="Cooperativa">Cooperativa</SelectItem>
                            <SelectItem value="Fundación">Fundación</SelectItem>
                            <SelectItem value="ESAL">ESAL (Entidad Sin Ánimo de Lucro)</SelectItem>
                            <SelectItem value="Otra">Otra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="jurCiiu">Código CIIU Principal *</Label>
                      <Input
                        id="jurCiiu"
                        value={jurCiiu}
                        onChange={(e) => setJurCiiu(e.target.value)}
                        placeholder="Código de actividad económica principal (ej. 4711)"
                        className="mt-1 bg-background/50"
                      />
                    </div>
                  </div>

                  {/* Representante Legal */}
                  <div className="space-y-4 border-t border-border/40 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserIcon className="h-4 w-4" /> Representante Legal
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label>Tipo Documento *</Label>
                        <Select value={jurRepTipoDoc} onValueChange={(val) => setJurRepTipoDoc(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CC">Cédula de Ciudadanía (CC)</SelectItem>
                            <SelectItem value="CE">Cédula de Extranjería (CE)</SelectItem>
                            <SelectItem value="PA">Pasaporte (PA)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="jurRepNumDoc">Número Documento *</Label>
                        <Input
                          id="jurRepNumDoc"
                          value={jurRepNumDoc}
                          onChange={(e) => setJurRepNumDoc(e.target.value)}
                          placeholder="Número de documento de identificación"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="jurRepNombres">Nombres *</Label>
                        <Input
                          id="jurRepNombres"
                          value={jurRepNombres}
                          onChange={(e) => setJurRepNombres(e.target.value)}
                          placeholder="Nombres completos"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jurRepApellidos">Apellidos *</Label>
                        <Input
                          id="jurRepApellidos"
                          value={jurRepApellidos}
                          onChange={(e) => setJurRepApellidos(e.target.value)}
                          placeholder="Apellidos completos"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jurRepEmail">Correo de Contacto *</Label>
                        <Input
                          id="jurRepEmail"
                          type="email"
                          value={jurRepEmail}
                          onChange={(e) => setJurRepEmail(e.target.value)}
                          placeholder="recibe@tokenhabilitacion.com"
                          className="mt-1 bg-background/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tributos */}
                  <div className="space-y-4 border-t border-border/40 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Régimen & Responsabilidades Fiscales RUT</h3>
                    
                    <div className="space-y-2">
                      <Label>Responsabilidades Fiscales (Selecciona las aplicables) *</Label>
                      <div className="grid gap-2 sm:grid-cols-2 mt-1">
                        {FISCAL_RESPONSIBILITIES_JURIDICA.map((r) => (
                          <label
                            key={r.code}
                            className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                              jurSelectedResp.includes(r.code)
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border bg-background/30 text-muted-foreground hover:bg-background/55"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={jurSelectedResp.includes(r.code)}
                              onChange={() => handleJurToggle(r.code)}
                              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span>{r.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Régimen Tributario *</Label>
                        <Select value={jurRegimenTrib} onValueChange={(val) => setJurRegimenTrib(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Régimen Ordinario">Régimen Ordinario</SelectItem>
                            <SelectItem value="Régimen Simple de Tributación">Régimen Simple de Tributación</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Régimen Fiscal IVA *</Label>
                        <Select value={jurRegimenIva} onValueChange={(val) => setJurRegimenIva(val || "")}>
                          <SelectTrigger className="mt-1 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Responsable de IVA">Responsable de IVA</SelectItem>
                            <SelectItem value="No responsable de IVA">No responsable de IVA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Contact Section */}
              <div className="space-y-4 border-t border-border/40 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Datos de Contacto y Ubicación Fiscal
                </h3>
                
                <div>
                  <Label htmlFor="billingEmail">Correo Electrónico RUT *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="billingEmail"
                      type="email"
                      value={activeTab === "NATURAL" ? natEmail : jurEmail}
                      onChange={(e) => activeTab === "NATURAL" ? setNatEmail(e.target.value) : setJurEmail(e.target.value)}
                      placeholder="correo@registrado-en-rut.com"
                      className="pl-9 bg-background/50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="billingAddress">Dirección Fiscal *</Label>
                  <Input
                    id="billingAddress"
                    value={activeTab === "NATURAL" ? natDireccion : jurDireccion}
                    onChange={(e) => activeTab === "NATURAL" ? setNatDireccion(e.target.value) : setJurDireccion(e.target.value)}
                    placeholder="ej: Calle 10 # 43A - 50, Apto 302"
                    className="mt-1 bg-background/50"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Departamento *</Label>
                    <Select value={department} onValueChange={(val) => handleDepartmentChange(val || "")}>
                      <SelectTrigger className="mt-1 bg-background/50">
                        <SelectValue placeholder="Selecciona departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(DEPARTMENTS).map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Municipio / Ciudad *</Label>
                    <Select value={municipality} onValueChange={(val) => setMunicipality(val || "")} disabled={!department}>
                      <SelectTrigger className="mt-1 bg-background/50">
                        <SelectValue placeholder="Selecciona municipio" />
                      </SelectTrigger>
                      <SelectContent>
                        {municipalities.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Shared Resolution Section */}
              <div className="space-y-4 border-t border-border/40 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> Resolución Autorizada y Firma Digital (DIAN)
                </h3>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="billingPrefijo">Prefijo Autorizado *</Label>
                    <Input
                      id="billingPrefijo"
                      value={activeTab === "NATURAL" ? natPrefijo : jurPrefijo}
                      onChange={(e) => activeTab === "NATURAL" ? setNatPrefijo(e.target.value) : setJurPrefijo(e.target.value)}
                      placeholder="ej: INV"
                      className="mt-1 bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingDesde">Consecutivo Desde *</Label>
                    <Input
                      id="billingDesde"
                      type="number"
                      value={activeTab === "NATURAL" ? natDesde : jurDesde}
                      onChange={(e) => activeTab === "NATURAL" ? setNatDesde(e.target.value) : setJurDesde(e.target.value)}
                      placeholder="1"
                      className="mt-1 bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingHasta">Consecutivo Hasta *</Label>
                    <Input
                      id="billingHasta"
                      type="number"
                      value={activeTab === "NATURAL" ? natHasta : jurHasta}
                      onChange={(e) => activeTab === "NATURAL" ? setNatHasta(e.target.value) : setJurHasta(e.target.value)}
                      placeholder="10000"
                      className="mt-1 bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="billingResolucion">Número Resolución DIAN *</Label>
                    <Input
                      id="billingResolucion"
                      value={activeTab === "NATURAL" ? natResolucion : jurResolucion}
                      onChange={(e) => activeTab === "NATURAL" ? setNatResolucion(e.target.value) : setJurResolucion(e.target.value)}
                      placeholder="Número de resolución de facturación autorizada"
                      className="mt-1 bg-background/50"
                    />
                  </div>
                  <div>
                    <Label>Modo de Operación *</Label>
                    <Select
                      value={activeTab === "NATURAL" ? natModo : jurModo}
                      onValueChange={(val) => activeTab === "NATURAL" ? setNatModo(val || "") : setJurModo(val || "")}
                    >
                      <SelectTrigger className="mt-1 bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Facturación Gratuita DIAN">Facturación Gratuita DIAN</SelectItem>
                        <SelectItem value="Proveedor Tecnológico">Proveedor Tecnológico</SelectItem>
                        <SelectItem value="Desarrollo Propio">Desarrollo Propio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Fecha de Resolución *</Label>
                    <div className="mt-1">
                      <DatePicker
                        value={activeTab === "NATURAL" ? natFechaResolucion : jurFechaResolucion}
                        onChange={(date) => activeTab === "NATURAL" ? setNatFechaResolucion(date) : setJurFechaResolucion(date)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Vigencia Hasta *</Label>
                    <div className="mt-1">
                      <DatePicker
                        value={activeTab === "NATURAL" ? natFechaVigencia : jurFechaVigencia}
                        onChange={(date) => activeTab === "NATURAL" ? setNatFechaVigencia(date) : setJurFechaVigencia(date)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="billingFirma">Archivo de Firma Digital (.pfx) *</Label>
                  <div className="flex gap-3 items-center mt-1">
                    <Input
                      id="billingFirma"
                      value={activeTab === "NATURAL" ? natFirma : jurFirma}
                      onChange={(e) => activeTab === "NATURAL" ? setNatFirma(e.target.value) : setJurFirma(e.target.value)}
                      className="bg-background/50 font-mono text-xs flex-1"
                    />
                    <span className="text-[10px] bg-muted border border-border/60 px-3 py-2 rounded-lg text-muted-foreground whitespace-nowrap">
                      Cargado
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    El certificado se encripta de extremo a extremo para garantizar la seguridad de su firma digital ante la DIAN.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-border/40 pt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/users")}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={configureNatural.isPending || configureJuridica.isPending}
                  className="flex items-center gap-1.5 cursor-pointer text-white"
                >
                  {configureNatural.isPending || configureJuridica.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {configureNatural.isPending || configureJuridica.isPending ? "Guardando..." : "Guardar Configuración"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deletion Confirm Dialog */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="¿Eliminar Perfil de Facturación?"
        description="Esta acción desvinculará de forma permanente tu perfil fiscal de facturación electrónica. No se puede deshacer."
        confirmLabel="Eliminar Perfil"
        cancelLabel="Cancelar"
        isLoading={deleteProfile.isPending}
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  )

  // Handlers for checkboxes
  function handleNatToggle(code: string) {
    handleNatRespToggle(code)
  }
  function handleJurToggle(code: string) {
    handleJurRespToggle(code)
  }
}
