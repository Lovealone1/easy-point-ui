"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Trash2,
  Loader2,
  ShieldAlert,
  Palette,
  Sparkles,
  Eye,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
  Building2,
  Mail,
  Award
} from 'lucide-react';
import { useAuthStore, type OrganizationConfig } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import {
  updateConfig,
  uploadLogo,
  deleteLogo,
  uploadLogoShort,
  deleteLogoShort
} from '@/features/organization-configs/services/organization-configs.service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from '@/shared/utils/toast';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverTrigger, PopoverContent } from '@/shared/components/ui/popover';
import { cn } from '@/shared/lib/utils';

export default function OrganizationPage() {
  const router = useRouter();
  const {
    organizationConfig,
    setOrganizationConfig,
    activeOrganization,
    setActiveOrganization,
    hasOrgRole,
    hasGlobalRole
  } = useAuthStore();

  const { theme: currentUiTheme } = useUiStore();

  // Role restrictions
  const isAdmin = hasOrgRole('OWNER', 'ADMINISTRATOR');
  const isGlobalAdmin = hasGlobalRole('ADMIN');

  // Keep a reference to the initial configuration to restore on Cancel / Unmount if unsaved
  const initialConfigRef = useRef<OrganizationConfig | null>(null);
  const isSavedRef = useRef<boolean>(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#8b1fc1');
  const [defaultTheme, setDefaultTheme] = useState<'LIGHT' | 'DARK' | 'SYSTEM'>('SYSTEM');
  const [isSaving, setIsSaving] = useState(false);

  // Logo Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

  // Short Logo Upload State
  const [isDraggingShort, setIsDraggingShort] = useState(false);
  const [isUploadingLogoShort, setIsUploadingLogoShort] = useState(false);
  const [isDeletingLogoShort, setIsDeletingLogoShort] = useState(false);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputShortRef = useRef<HTMLInputElement>(null);

  // 1. Initialize form state from store
  useEffect(() => {
    if (activeOrganization) {
      setName(activeOrganization.name || '');
    }
    if (organizationConfig) {
      setEmail(organizationConfig.organizationEmail || '');
      setPrimaryColor(organizationConfig.primaryColor || '#8b1fc1');
      setDefaultTheme(organizationConfig.defaultTheme || 'SYSTEM');

      // Store initial config once if not already stored
      if (!initialConfigRef.current) {
        initialConfigRef.current = { ...organizationConfig };
      }
    }
  }, [organizationConfig, activeOrganization]);

  // 2. Cleanup on unmount - Restore preview changes if not explicitly saved
  useEffect(() => {
    return () => {
      if (!isSavedRef.current && initialConfigRef.current) {
        setOrganizationConfig(initialConfigRef.current);
      }
    };
  }, [setOrganizationConfig]);

  // 3. Real-time preview handler for Color change
  const handleColorChange = (color: string) => {
    setPrimaryColor(color);

    // Only apply if it's a valid hex
    if (isValidHex(color) && organizationConfig) {
      setOrganizationConfig({
        ...organizationConfig,
        primaryColor: color
      });
    }
  };

  // 4. Real-time preview handler for Theme change
  const handleThemeChange = (themeVal: 'LIGHT' | 'DARK' | 'SYSTEM') => {
    setDefaultTheme(themeVal);

    if (organizationConfig) {
      setOrganizationConfig({
        ...organizationConfig,
        defaultTheme: themeVal
      });
    }
  };

  const isValidHex = (hex: string) => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  // 5. File Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isAdmin) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processLogoFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processLogoFile(files[0]);
    }
  };

  const processLogoFile = async (file: File) => {
    const validTypes = ['image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Sólo se permiten imágenes PNG o SVG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El límite máximo es 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    const toastId = toast.loading('Subiendo logo...');

    try {
      const updatedConfig = await uploadLogo(file);
      setOrganizationConfig(updatedConfig);
      if (initialConfigRef.current) {
        initialConfigRef.current.logoUrl = updatedConfig.logoUrl;
      }
      toast.dismiss(toastId);
      toast.success('Logo subido y aplicado exitosamente.');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error : 'Error al subir el logo');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!isAdmin || !organizationConfig?.logoUrl) return;

    if (!confirm('¿Estás seguro de que deseas eliminar el logo de la organización? Se restaurará el nombre de texto.')) {
      return;
    }

    setIsDeletingLogo(true);
    const toastId = toast.loading('Eliminando logo...');

    try {
      const updatedConfig = await deleteLogo();
      setOrganizationConfig(updatedConfig);
      if (initialConfigRef.current) {
        initialConfigRef.current.logoUrl = null;
      }
      toast.dismiss(toastId);
      toast.success('Logo eliminado exitosamente.');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error : 'Error al eliminar el logo');
    } finally {
      setIsDeletingLogo(false);
    }
  };

  const processLogoShortFile = async (file: File) => {
    const validTypes = ['image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Sólo se permiten imágenes PNG o SVG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El límite máximo es 2MB.');
      return;
    }

    setIsUploadingLogoShort(true);
    const toastId = toast.loading('Subiendo logo resumido...');

    try {
      const updatedConfig = await uploadLogoShort(file);
      setOrganizationConfig(updatedConfig);
      if (initialConfigRef.current) {
        initialConfigRef.current.logoShortUrl = updatedConfig.logoShortUrl;
      }
      toast.dismiss(toastId);
      toast.success('Logo resumido subido y aplicado exitosamente.');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error : 'Error al subir el logo resumido');
    } finally {
      setIsUploadingLogoShort(false);
      if (fileInputShortRef.current) fileInputShortRef.current.value = '';
    }
  };

  const handleDragOverShort = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsDraggingShort(true);
  };

  const handleDragLeaveShort = () => {
    setIsDraggingShort(false);
  };

  const handleDropShort = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingShort(false);
    if (!isAdmin) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processLogoShortFile(files[0]);
    }
  };

  const handleFileSelectShort = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processLogoShortFile(files[0]);
    }
  };

  const handleDeleteLogoShort = async () => {
    if (!isAdmin || !organizationConfig?.logoShortUrl) return;

    if (!confirm('¿Estás seguro de que deseas eliminar el logo resumido de la organización?')) {
      return;
    }

    setIsDeletingLogoShort(true);
    const toastId = toast.loading('Eliminando logo resumido...');

    try {
      const updatedConfig = await deleteLogoShort();
      setOrganizationConfig(updatedConfig);
      if (initialConfigRef.current) {
        initialConfigRef.current.logoShortUrl = null;
      }
      toast.dismiss(toastId);
      toast.success('Logo resumido eliminado exitosamente.');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error : 'Error al eliminar el logo resumido');
    } finally {
      setIsDeletingLogoShort(false);
    }
  };

  // 6. Submit handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!isValidHex(primaryColor)) {
      toast.error('El color primario debe ser un código hexadecimal válido (Ej: #571777)');
      return;
    }

    const payload: any = {
      primaryColor,
      defaultTheme
    };

    if (isGlobalAdmin) {
      if (!name.trim()) {
        toast.error('El nombre de la organización es obligatorio.');
        return;
      }
      payload.organizationName = name;
      payload.organizationEmail = email || null;
    }

    setIsSaving(true);
    try {
      const updatedConfig = await updateConfig(payload);

      // Update state & save reference
      setOrganizationConfig(updatedConfig);
      if (activeOrganization && isGlobalAdmin) {
        setActiveOrganization({
          ...activeOrganization,
          name: updatedConfig.organizationName
        });
      }
      initialConfigRef.current = { ...updatedConfig };
      isSavedRef.current = true;

      toast.success('Cambios guardados exitosamente.');
    } catch (error) {
      toast.error(error instanceof Error ? error : 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialConfigRef.current) {
      setOrganizationConfig(initialConfigRef.current);
    }
    router.push('/dashboard');
  };

  const handleReset = () => {
    if (initialConfigRef.current) {
      if (activeOrganization) {
        setName(initialConfigRef.current.organizationName || activeOrganization.name);
      }
      setEmail(initialConfigRef.current.organizationEmail || '');
      setPrimaryColor(initialConfigRef.current.primaryColor || '#8b1fc1');
      handleColorChange(initialConfigRef.current.primaryColor || '#8b1fc1');

      setDefaultTheme(initialConfigRef.current.defaultTheme || 'SYSTEM');
      handleThemeChange(initialConfigRef.current.defaultTheme || 'SYSTEM');
      toast.info('Se han restablecido los valores guardados.');
    }
  };

  const planName = organizationConfig?.plan || 'FREE';
  const planActiveUntil = organizationConfig?.planActiveUntil;

  const dateCreated = organizationConfig?.organizationCreatedAt
    ? new Date(organizationConfig.organizationCreatedAt).toLocaleDateString()
    : 'N/A';

  return (
    <div className="w-full p-2 md:p-4 space-y-6 bg-background text-foreground transition-colors duration-300">
      <div className="w-full space-y-6">

        {/* Header Section */}
        <header className="p-6 rounded-2xl border border-border/60 bg-gradient-to-r from-card/30 to-brand-500/5 backdrop-blur-md shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-6 w-6 text-brand-500" />
                <h1 className="text-3xl font-extrabold tracking-tight">{name || activeOrganization?.name || 'Cargando...'}</h1>
              </div>
              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                <span className="font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/50 text-foreground">{activeOrganization?.slug || 'sin-slug'}.easypoint.com</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="font-mono bg-muted/60 px-2 py-0.5 rounded border border-border/50 text-foreground">ID Org: {activeOrganization?.id}</span>
                <span className="text-muted-foreground/60">•</span>
                <span>Creada el {dateCreated}</span>
              </p>
            </div>

            {/* Plan Badge & Expiration */}
            <div className="flex flex-col items-start md:items-end gap-1.5 select-none">
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider border uppercase shadow-xs",
                planName === 'PREMIUM'
                  ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                  : planName === 'BASIC'
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                    : "bg-muted text-muted-foreground border-border"
              )}>
                <Award className="h-4 w-4" />
                <span>Plan {planName}</span>
              </div>
              {planName !== 'FREE' && planActiveUntil && (
                <span className="text-xs text-muted-foreground font-medium bg-muted/50 border border-border/40 px-2 py-0.5 rounded-md">
                  Activo hasta: {new Date(planActiveUntil).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Permissions Warning Card (Read-only roles) */}
        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500/90 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Modo de Sólo Lectura</span>
              <p className="text-amber-500/70 text-xs">
                No dispones de privilegios de Administrador o Propietario en esta organización. Las siguientes opciones son demostrativas y no afectarán a la plataforma global.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Settings Section (Left 7 Cols) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">

            {/* Logo Configuration Card */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs space-y-6">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Logotipos de la Organización</h3>
                <p className="text-xs text-muted-foreground">Administra los logotipos corporativos para diferentes secciones del sistema.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* ── LOGO PRINCIPAL ── */}
                <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-background/25">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm text-foreground">Logo Principal</h4>
                      <p className="text-[10px] text-muted-foreground font-normal">Para el encabezado global y páginas principales.</p>
                    </div>
                    {organizationConfig?.logoUrl && isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteLogo}
                        disabled={isDeletingLogo}
                        className="h-7 border-destructive/40 text-destructive hover:bg-destructive/5 px-2"
                      >
                        {isDeletingLogo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        <span className="ml-1 text-[10px]">Eliminar</span>
                      </Button>
                    )}
                  </div>

                  {/* Preview & Upload Zone */}
                  <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center h-28 border border-border/80 rounded-xl bg-muted/30 relative overflow-hidden group">
                      {organizationConfig?.logoUrl ? (
                        <img
                          src={organizationConfig.logoUrl}
                          alt="Logo principal"
                          className="max-h-16 max-w-[85%] object-contain select-none transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-center p-2 text-muted-foreground">
                          <span className="text-xs font-semibold block">{name || activeOrganization?.name || 'EasyPoint'}</span>
                          <span className="text-[10px] text-muted-foreground/60">(Fallback de Texto)</span>
                        </div>
                      )}
                      <div className="absolute bottom-1 right-2 text-[8px] font-mono opacity-40">Vista Previa</div>
                    </div>

                    <div
                      className={`flex flex-col items-center justify-center h-28 border border-dashed rounded-xl transition-all duration-300 text-center p-4 relative ${!isAdmin
                        ? 'border-muted bg-muted/10 cursor-not-allowed opacity-60'
                        : isDragging
                          ? 'border-brand-500 bg-brand-500/5 scale-[0.99] shadow-inner'
                          : 'border-border/80 hover:border-brand-500/50 hover:bg-accent/10 cursor-pointer'
                        }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => isAdmin && fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".png,.svg"
                        onChange={handleFileSelect}
                        disabled={!isAdmin || isUploadingLogo}
                      />
                      {isUploadingLogo ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                          <span className="text-[11px] text-muted-foreground font-medium">Subiendo...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Upload className={`h-5 w-5 ${isDragging ? 'text-brand-500' : 'text-muted-foreground'}`} />
                          <div>
                            <span className="text-[11px] font-semibold text-brand-500">Arrastra una imagen</span>{' '}
                            <span className="text-[11px] text-muted-foreground">o haz clic</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground/60">Soporta PNG, SVG. Máx 2MB.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── LOGO RESUMIDO (CUADRADO) ── */}
                <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-background/25">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-semibold text-sm text-foreground">Logo Resumido (Cuadrado)</h4>
                      <p className="text-[10px] text-muted-foreground font-normal">Para la barra lateral (sidebar) y layouts reducidos.</p>
                    </div>
                    {organizationConfig?.logoShortUrl && isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteLogoShort}
                        disabled={isDeletingLogoShort}
                        className="h-7 border-destructive/40 text-destructive hover:bg-destructive/5 px-2"
                      >
                        {isDeletingLogoShort ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        <span className="ml-1 text-[10px]">Eliminar</span>
                      </Button>
                    )}
                  </div>

                  {/* Preview & Upload Zone */}
                  <div className="space-y-3">
                    <div className="flex flex-col items-center justify-center h-28 border border-border/80 rounded-xl bg-muted/30 relative overflow-hidden group">
                      {organizationConfig?.logoShortUrl ? (
                        <img
                          src={organizationConfig.logoShortUrl}
                          alt="Logo resumido"
                          className="max-h-16 max-w-[85%] object-contain select-none transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted border border-sidebar-border flex items-center justify-center font-bold text-base text-foreground select-none rounded-xl">
                          {name ? name.charAt(0).toUpperCase() : (activeOrganization?.name ? activeOrganization.name.charAt(0).toUpperCase() : 'O')}
                        </div>
                      )}
                      <div className="absolute bottom-1 right-2 text-[8px] font-mono opacity-40">Vista Previa</div>
                    </div>

                    <div
                      className={`flex flex-col items-center justify-center h-28 border border-dashed rounded-xl transition-all duration-300 text-center p-4 relative ${!isAdmin
                        ? 'border-muted bg-muted/10 cursor-not-allowed opacity-60'
                        : isDraggingShort
                          ? 'border-brand-500 bg-brand-500/5 scale-[0.99] shadow-inner'
                          : 'border-border/80 hover:border-brand-500/50 hover:bg-accent/10 cursor-pointer'
                        }`}
                      onDragOver={handleDragOverShort}
                      onDragLeave={handleDragLeaveShort}
                      onDrop={handleDropShort}
                      onClick={() => isAdmin && fileInputShortRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputShortRef}
                        className="hidden"
                        accept=".png,.svg"
                        onChange={handleFileSelectShort}
                        disabled={!isAdmin || isUploadingLogoShort}
                      />
                      {isUploadingLogoShort ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                          <span className="text-[11px] text-muted-foreground font-medium">Subiendo...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <Upload className={`h-5 w-5 ${isDraggingShort ? 'text-brand-500' : 'text-muted-foreground'}`} />
                          <div>
                            <span className="text-[11px] font-semibold text-brand-500">Arrastra una imagen</span>{' '}
                            <span className="text-[11px] text-muted-foreground">o haz clic</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground/60">Soporta PNG, SVG. Máx 2MB.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Colors and Themes Config Card */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-xs space-y-6">

              <div className="space-y-0.5">
                <h3 className="font-bold text-lg">Branding Visual</h3>
                <p className="text-xs text-muted-foreground">Controla el color de acento primario y el esquema de temas para la plataforma.</p>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <Label htmlFor="defaultTheme" className="text-sm font-semibold">Tema por Defecto</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">Modo visual por defecto al iniciar sesión. Los usuarios pueden anularlo localmente.</p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { id: 'LIGHT', label: 'Claro', icon: Sun },
                    { id: 'DARK', label: 'Oscuro', icon: Moon },
                    { id: 'SYSTEM', label: 'Sistema', icon: Laptop }
                  ].map((t) => {
                    const IconComp = t.icon;
                    const isSelected = defaultTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleThemeChange(t.id as any)}
                        disabled={!isAdmin && defaultTheme !== t.id}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all duration-300 gap-2 relative ${isSelected
                          ? 'bg-brand-500/10 border-brand-500 text-brand-400 font-semibold shadow-xs'
                          : 'bg-transparent border-border/80 text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                          } ${!isAdmin && 'cursor-default opacity-85'}`}
                      >
                        <IconComp className="h-5 w-5" />
                        <span className="text-xs">{t.label}</span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker Section */}
              <div className="space-y-4 pt-2 border-t border-border/55">
                <div className="space-y-1">
                  <Label htmlFor="primaryColor" className="text-sm font-semibold">Color Primario (Hexadecimal)</Label>
                  <p className="text-[11px] text-muted-foreground">Genera dinámicamente toda la escala de colores (50-950) de la plataforma.</p>
                </div>

                <div className="flex gap-4 items-center">

                  {/* Custom Color Trigger & Picker */}
                  <Popover>
                    <PopoverTrigger disabled={!isAdmin} className="relative group shrink-0 outline-none">
                      <div
                        className="h-12 w-12 rounded-xl border-2 border-border shadow-inner cursor-pointer select-none group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundColor: primaryColor }}
                        title="Seleccionar color"
                      />
                      <div className="absolute -bottom-1 -right-1 p-0.5 bg-background rounded-md border border-border shadow-xs group-hover:scale-105 transition-transform duration-300">
                        <Palette className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4 border border-border/60 shadow-xl rounded-xl" align="start" side="bottom">
                      <div className="space-y-4">
                        <HexColorPicker color={primaryColor} onChange={handleColorChange} />

                        {/* Quick preset colors */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recomendados</span>
                          <div className="flex flex-wrap gap-2 max-w-[200px]">
                            {['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b1fc1', '#d946ef', '#f43f5e', '#000000', '#ffffff'].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                className="w-6 h-6 rounded-md shadow-sm border border-border/50 hover:scale-110 transition-transform flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                style={{ backgroundColor: preset }}
                                onClick={() => handleColorChange(preset)}
                                aria-label={`Seleccionar ${preset}`}
                              >
                                {preset.toLowerCase() === primaryColor.toLowerCase() && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white mix-blend-difference" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="flex-1 space-y-1.5">
                    <Input
                      id="primaryColorInput"
                      type="text"
                      placeholder="#571777"
                      maxLength={7}
                      value={primaryColor}
                      disabled={!isAdmin}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className={`font-mono text-sm tracking-widest ${!isValidHex(primaryColor) ? 'border-destructive focus-visible:ring-destructive/30' : ''
                        }`}
                    />
                    {!isValidHex(primaryColor) && (
                      <p className="text-[10px] text-destructive font-medium">Debe ser un código hexadecimal válido (ej: #571777).</p>
                    )}
                  </div>
                </div>

                {/* Real-time Palette Demo */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Muestra de Tonalidades Generadas</span>
                  <div className="grid grid-cols-11 h-4 rounded-md overflow-hidden border border-border shadow-xs">
                    {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((shade) => (
                      <div
                        key={shade}
                        style={{ backgroundColor: `var(--color-brand-${shade})` }}
                        className="h-full w-full"
                        title={`Tono ${shade}`}
                      />
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Actions Footer */}
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
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  className="border border-border/80"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Restablecer
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving || !isValidHex(primaryColor)}
                  className="bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 px-6"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Guardar Cambios
                </Button>
              </div>
            )}

          </form>

          {/* Live Preview Column (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Eye className="h-4 w-4 text-brand-500" />
              <span>Vista previa en tiempo real</span>
              <Sparkles className="h-3.5 w-3.5 text-brand-400 animate-pulse ml-auto" />
            </div>

            {/* Device/Mockup Shell */}
            <div className="border border-border bg-card rounded-2xl shadow-xl overflow-hidden text-foreground flex flex-col h-[420px]">

              {/* Fake Window Header */}
              <div className="bg-muted/70 px-4 py-2 border-b border-border/80 flex items-center gap-1.5 justify-between">
                <div className="flex gap-1.5 items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground bg-background px-8 py-0.5 rounded-md border border-border/50 max-w-[150px] truncate select-none">
                  {activeOrganization?.slug || 'mi-empresa'}.easypoint.com
                </div>
                <div className="w-10" />
              </div>

              {/* Fake Header */}
              <div className="h-12 border-b border-border/40 bg-background/95 backdrop-blur px-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  {organizationConfig?.logoUrl ? (
                    <img
                      src={organizationConfig.logoUrl}
                      alt="Logo"
                      className="h-5 w-auto object-contain max-w-[100px]"
                    />
                  ) : (
                    <span className="text-sm font-bold tracking-tight">EasyPoint</span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-medium scale-90">
                    {name || activeOrganization?.name || 'Org'}
                  </span>
                </div>

                {/* Fake Controls */}
                <div className="flex gap-1.5 items-center">
                  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                    {currentUiTheme === 'dark' ? <Moon className="h-3.5 w-3.5 text-muted-foreground" /> : <Sun className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <div className="h-6 w-12 rounded bg-muted/65 text-[9px] font-medium flex items-center justify-center text-muted-foreground leading-none">
                    Salir
                  </div>
                </div>
              </div>

              {/* Mockup Workspace */}
              <div className="flex-1 bg-background p-4 flex gap-4 overflow-hidden">

                {/* Fake Sidebar */}
                <div className="w-24 shrink-0 space-y-3 border-r border-border/30 pr-2 hidden sm:block">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden mx-auto">
                    {organizationConfig?.logoShortUrl ? (
                      <img
                        src={organizationConfig.logoShortUrl}
                        alt="Logo corto"
                        className="h-full w-full object-contain"
                      />
                    ) : organizationConfig?.logoUrl ? (
                      <img
                        src={organizationConfig.logoUrl}
                        alt="Logo largo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-bold">{name ? name.charAt(0).toUpperCase() : (activeOrganization?.name ? activeOrganization.name.charAt(0).toUpperCase() : 'O')}</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-full rounded bg-brand-500/15 border-l-2 border-brand-500" />
                    <div className="h-4 w-18 rounded bg-muted/30" />
                    <div className="h-4 w-16 rounded bg-muted/30" />
                  </div>
                </div>

                {/* Fake App Body */}
                <div className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-1">
                    <div className="h-4 w-28 rounded bg-muted/70" />
                    <div className="h-3 w-40 rounded bg-muted/40" />
                  </div>

                  {/* Simulated Cards */}
                  <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-3">
                    <div className="h-3.5 w-16 rounded bg-muted/80" />
                    <div className="h-2.5 w-full rounded bg-muted/40" />
                    <div className="h-2.5 w-3/4 rounded bg-muted/40" />

                    <div className="flex gap-2 pt-1.5">
                      {/* Brand Button */}
                      <div className="h-7 px-3 rounded-md bg-brand-500 text-white text-[9px] font-bold inline-flex items-center justify-center shadow-xs cursor-default">
                        Botón Primario
                      </div>

                      {/* Brand Outline Button */}
                      <div className="h-7 px-3 rounded-md border border-brand-500/30 text-brand-400 text-[9px] font-semibold inline-flex items-center justify-center bg-brand-500/5 cursor-default">
                        Secundario
                      </div>
                    </div>
                  </div>

                  {/* Ring demo inputs */}
                  <div className="p-4 rounded-xl border border-border/80 bg-card shadow-xs space-y-2">
                    <div className="h-3 w-16 rounded bg-muted/80" />
                    <div className="h-7 w-full rounded-md border border-brand-500 bg-transparent px-2 flex items-center ring-2 ring-brand-500/20 text-[9px] text-muted-foreground select-none">
                      Texto enfocado...
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
