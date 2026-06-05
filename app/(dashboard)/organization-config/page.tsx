"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  ShieldAlert, 
  Globe, 
  DollarSign, 
  Calendar, 
  Languages, 
  FileText, 
  MapPin, 
  Phone, 
  MessageSquare,
  Building,
  Save
} from 'lucide-react';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { updateConfig } from '@/features/organization-configs/services/organization-configs.service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { toast } from '@/shared/utils/toast';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/shared/components/ui/select';

const TIMEZONES = [
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
  { value: 'America/Bogota', label: 'Bogotá, Colombia (COT - UTC-5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México, México (CST - UTC-6)' },
  { value: 'America/Santiago', label: 'Santiago, Chile (CLT - UTC-3)' },
  { value: 'America/Lima', label: 'Lima, Perú (PET - UTC-5)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires, Argentina (ART - UTC-3)' },
  { value: 'America/New_York', label: 'Nueva York, EE.UU. (EST - UTC-5)' },
  { value: 'Europe/Madrid', label: 'Madrid, España (CET - UTC+1)' }
];

const CURRENCIES = [
  { value: 'COP', label: 'Peso Colombiano (COP - $)' },
  { value: 'USD', label: 'Dólar Estadounidense (USD - $)' },
  { value: 'EUR', label: 'Euro (EUR - €)' },
  { value: 'MXN', label: 'Peso Mexicano (MXN - $)' },
  { value: 'CLP', label: 'Peso Chileno (CLP - $)' },
  { value: 'PEN', label: 'Sol Peruano (PEN - S/.)' }
];

const LANGUAGES = [
  { value: 'es', label: 'Español (es)' },
  { value: 'en', label: 'Inglés (en)' },
  { value: 'pt', label: 'Portugués (pt)' }
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'Día/Mes/Año (DD/MM/YYYY)' },
  { value: 'MM/DD/YYYY', label: 'Mes/Día/Año (MM/DD/YYYY)' },
  { value: 'YYYY-MM-DD', label: 'Año-Mes-Día (YYYY-MM-DD)' }
];

export default function OrganizationConfigPage() {
  const router = useRouter();
  const { 
    organizationConfig, 
    setOrganizationConfig,
    activeOrganization,
    hasOrgRole 
  } = useAuthStore();

  const isAdmin = hasOrgRole('OWNER', 'ADMINISTRATOR');

  // Form State
  const [timezone, setTimezone] = useState('America/Bogota');
  const [currency, setCurrency] = useState('COP');
  const [language, setLanguage] = useState('es');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (organizationConfig) {
      setTimezone(organizationConfig.timezone || 'America/Bogota');
      setCurrency(organizationConfig.currency || 'COP');
      setLanguage(organizationConfig.language || 'es');
      setDateFormat(organizationConfig.dateFormat || 'DD/MM/YYYY');
      setTaxId(organizationConfig.taxId || '');
      setAddress(organizationConfig.address || '');
      setPhone(organizationConfig.phone || '');
      setReceiptFooter(organizationConfig.receiptFooter || '');
    }
  }, [organizationConfig]);

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    try {
      const updatedConfig = await updateConfig({
        timezone,
        currency,
        language,
        dateFormat,
        taxId: taxId || null,
        address: address || null,
        phone: phone || null,
        receiptFooter: receiptFooter || null
      });

      // Update state
      setOrganizationConfig(updatedConfig);
      toast.success('Configuraciones guardadas exitosamente.');
    } catch (error) {
      toast.error(error instanceof Error ? error : 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-background text-foreground transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Breadcrumb Back Link */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </Link>

          <span className="text-xs text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full font-mono">
            {activeOrganization?.name || 'Organización'}
          </span>
        </div>

        {/* Header Section */}
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Ajustes Generales</h1>
          <p className="text-muted-foreground text-sm">
            Configura las preferencias regionales, fiscales y detalles de facturación de tu organización.
          </p>
        </header>

        {/* Permissions Warning Card (Read-only roles) */}
        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500/90 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Modo de Sólo Lectura</span>
              <p className="text-amber-500/70 text-xs">
                No dispones de privilegios de Administrador o Propietario en esta organización. Las siguientes opciones son de sólo lectura.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Configuración Regional */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
              <Globe className="h-5 w-5 text-brand-500" />
              <div>
                <h3 className="font-bold text-base">Preferencias Regionales</h3>
                <p className="text-xs text-muted-foreground">Establece la zona horaria, moneda, idioma y formatos locales para la organización.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Zona Horaria */}
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-xs font-semibold flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Zona Horaria
                </Label>
                <Select value={timezone} onValueChange={(v) => setTimezone(v || '')} disabled={!isAdmin}>
                  <SelectTrigger id="timezone" className="bg-background">
                    <SelectValue placeholder="Selecciona la zona horaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Moneda */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-xs font-semibold flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Moneda Base
                </Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v || '')} disabled={!isAdmin}>
                  <SelectTrigger id="currency" className="bg-background">
                    <SelectValue placeholder="Selecciona la moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Idioma */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-xs font-semibold flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                  Idioma del Sistema
                </Label>
                <Select value={language} onValueChange={(v) => setLanguage(v || '')} disabled={!isAdmin}>
                  <SelectTrigger id="language" className="bg-background">
                    <SelectValue placeholder="Selecciona el idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Formato de Fecha */}
              <div className="space-y-2">
                <Label htmlFor="dateFormat" className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Formato de Fecha
                </Label>
                <Select value={dateFormat} onValueChange={(v) => setDateFormat(v || '')} disabled={!isAdmin}>
                  <SelectTrigger id="dateFormat" className="bg-background">
                    <SelectValue placeholder="Selecciona el formato de fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((df) => (
                      <SelectItem key={df.value} value={df.value}>
                        {df.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>

          {/* Información del Negocio */}
          <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
              <Building className="h-5 w-5 text-brand-500" />
              <div>
                <h3 className="font-bold text-base">Datos de Negocio y Facturación</h3>
                <p className="text-xs text-muted-foreground">Esta información se utilizará para facturas, recibos de venta y reportes.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* NIT / Identificación Fiscal */}
              <div className="space-y-2">
                <Label htmlFor="taxId" className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  NIT / Identificación Fiscal
                </Label>
                <Input
                  id="taxId"
                  type="text"
                  disabled={!isAdmin}
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="Ej: 901234567-8"
                  className="bg-background"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Teléfono Comercial
                </Label>
                <Input
                  id="phone"
                  type="text"
                  disabled={!isAdmin}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +57 300 123 4567"
                  className="bg-background"
                />
              </div>

              {/* Dirección */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="address" className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Dirección Comercial
                </Label>
                <Input
                  id="address"
                  type="text"
                  disabled={!isAdmin}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 123 #45-67, Bogotá, Colombia"
                  className="bg-background"
                />
              </div>

              {/* Pie de Recibo */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="receiptFooter" className="text-xs font-semibold flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  Pie de Página de Recibo (Ticket)
                </Label>
                <Textarea
                  id="receiptFooter"
                  disabled={!isAdmin}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Ej: ¡Muchas gracias por su compra! Vuelva pronto. Para devoluciones dispone de 30 días con este ticket."
                  className="bg-background min-h-[80px]"
                />
                <p className="text-[10px] text-muted-foreground">Este mensaje aparecerá al final de todos tus tickets impresos o digitales de ventas.</p>
              </div>

            </div>
          </div>

          {/* Form Actions */}
          {isAdmin && (
            <div className="flex gap-3 justify-end pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancelar
              </Button>

              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 px-6"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Ajustes
              </Button>
            </div>
          )}

        </form>

      </div>
    </div>
  );
}
