"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
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
  Laptop
} from 'lucide-react';
import { useAuthStore, type OrganizationConfig } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { 
  updateConfig, 
  uploadLogo, 
  deleteLogo 
} from '@/shared/services/organization-configs.service';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from '@/shared/utils/toast';

export default function OrganizationConfigPage() {
  const router = useRouter();
  const { 
    organizationConfig, 
    setOrganizationConfig,
    activeOrganization,
    hasOrgRole 
  } = useAuthStore();

  const { theme: currentUiTheme } = useUiStore();

  // Role restriction: Only Owner and Admin can edit
  const isAdmin = hasOrgRole('OWNER', 'ADMINISTRATOR');

  // Keep a reference to the initial configuration to restore on Cancel / Unmount if unsaved
  const initialConfigRef = useRef<OrganizationConfig | null>(null);
  const isSavedRef = useRef<boolean>(false);

  // Form State
  const [primaryColor, setPrimaryColor] = useState('#8b1fc1');
  const [defaultTheme, setDefaultTheme] = useState<'LIGHT' | 'DARK' | 'SYSTEM'>('SYSTEM');
  const [isSaving, setIsSaving] = useState(false);

  // Logo Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initialize form state from store
  useEffect(() => {
    if (organizationConfig) {
      setPrimaryColor(organizationConfig.primaryColor || '#8b1fc1');
      setDefaultTheme(organizationConfig.defaultTheme || 'SYSTEM');
      
      // Store initial config once if not already stored
      if (!initialConfigRef.current) {
        initialConfigRef.current = { ...organizationConfig };
      }
    }
  }, [organizationConfig]);

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
    // Validate format
    const validTypes = ['image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Sólo se permiten imágenes PNG o SVG.');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El límite máximo es 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    const toastId = toast.loading('Subiendo logo...');

    try {
      const updatedConfig = await uploadLogo(file);
      setOrganizationConfig(updatedConfig);
      // Update our fallback uploader reference so cancelling doesn't roll back the uploaded logo
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

  // 6. Submit handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!isValidHex(primaryColor)) {
      toast.error('El color primario debe ser un código hexadecimal válido (Ej: #571777)');
      return;
    }

    setIsSaving(true);
    try {
      const updatedConfig = await updateConfig({
        primaryColor,
        defaultTheme
      });

      // Update state & save reference
      setOrganizationConfig(updatedConfig);
      initialConfigRef.current = { ...updatedConfig };
      isSavedRef.current = true;

      toast.success('Configuración guardada exitosamente.');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error : 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore and redirect
    if (initialConfigRef.current) {
      setOrganizationConfig(initialConfigRef.current);
    }
    router.push('/dashboard');
  };

  const handleReset = () => {
    if (initialConfigRef.current) {
      setPrimaryColor(initialConfigRef.current.primaryColor || '#8b1fc1');
      handleColorChange(initialConfigRef.current.primaryColor || '#8b1fc1');
      
      setDefaultTheme(initialConfigRef.current.defaultTheme || 'SYSTEM');
      handleThemeChange(initialConfigRef.current.defaultTheme || 'SYSTEM');
      toast.info('Se han restablecido los valores guardados temporalmente.');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 bg-background text-foreground transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb Back Link */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </Link>

          {/* Quick Info */}
          <span className="text-xs text-muted-foreground bg-muted border border-border px-3 py-1 rounded-full font-mono">
            ID Org: {activeOrganization?.id}
          </span>
        </div>

        {/* Header Section */}
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Marca de Organización</h1>
          <p className="text-muted-foreground text-sm max-w-3xl">
            Ajusta la paleta de colores corporativos, logotipo y el tema predeterminado para todos los usuarios de <span className="font-semibold text-foreground">{activeOrganization?.name}</span>.
          </p>
        </header>

        {/* Permissions Warning Card (Read-only roles) */}
        {!isAdmin && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500/90 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">Modo de Sólo Lectura</span>
              <p className="text-amber-500/70 text-xs">
                No dispones de privilegios de Administrador o Propietario en esta organización. Las siguientes opciones son meramente demostrativas y no afectarán a la plataforma global.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Settings Section (Left 7 Cols) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
            
            {/* Logo Configuration Card */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-lg">Logotipo de la Organización</h3>
                  <p className="text-xs text-muted-foreground">Logotipo corporativo que se mostrará en el encabezado global.</p>
                </div>
                {organizationConfig?.logoUrl && isAdmin && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDeleteLogo}
                    disabled={isDeletingLogo}
                    className="border-destructive/40 text-destructive hover:bg-destructive/5"
                  >
                    {isDeletingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    <span className="ml-1.5 hidden sm:inline">Eliminar Logo</span>
                  </Button>
                )}
              </div>

              {/* Logo Preview and Dropzone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                
                {/* Image Live Preview */}
                <div className="flex flex-col items-center justify-center h-28 border border-border/80 rounded-xl bg-muted/30 relative overflow-hidden group">
                  {organizationConfig?.logoUrl ? (
                    <img 
                      src={organizationConfig.logoUrl} 
                      alt="Logo de la organización" 
                      className="max-h-16 max-w-[85%] object-contain select-none transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center p-2 text-muted-foreground">
                      <span className="text-xs font-semibold block">EasyPoint</span>
                      <span className="text-[10px] text-muted-foreground/60">(Fallback de Texto)</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-2 text-[8px] font-mono opacity-40">Vista Previa</div>
                </div>

                {/* Drag and Drop Zone */}
                <div 
                  className={`col-span-2 flex flex-col items-center justify-center h-28 border border-dashed rounded-xl transition-all duration-300 text-center p-4 relative ${
                    !isAdmin 
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
                      <span className="text-xs text-muted-foreground font-medium">Subiendo archivo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className={`h-5 w-5 ${isDragging ? 'text-brand-500' : 'text-muted-foreground'}`} />
                      <div>
                        <span className="text-xs font-semibold text-brand-500">Arrastra una imagen aquí</span>{' '}
                        <span className="text-xs text-muted-foreground">o haz clic para explorar</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60">Soporta PNG, SVG. Máx 2MB.</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Colors and Themes Config Card */}
            <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-md shadow-sm space-y-6">
              
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
                        className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all duration-300 gap-2 relative ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500 text-brand-400 font-semibold shadow-sm'
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
              <div className="space-y-4 pt-2 border-t border-border/50">
                <div className="space-y-1">
                  <Label htmlFor="primaryColor" className="text-sm font-semibold">Color Primario (Hexadecimal)</Label>
                  <p className="text-[11px] text-muted-foreground">Genera dinámicamente toda la escala de colores (50-950) de la plataforma.</p>
                </div>

                <div className="flex gap-4 items-center">
                  
                  {/* Styled Color Trigger */}
                  <div className="relative group shrink-0">
                    <input 
                      type="color" 
                      id="colorInputPicker"
                      value={primaryColor}
                      disabled={!isAdmin}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div 
                      className="h-12 w-12 rounded-xl border-2 border-border shadow-inner cursor-pointer select-none group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundColor: primaryColor }}
                      title="Seleccionar color"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 bg-background rounded-md border border-border shadow-xs group-hover:scale-105 transition-transform duration-300">
                      <Palette className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <Input
                      id="primaryColorInput"
                      type="text"
                      placeholder="#571777"
                      maxLength={7}
                      value={primaryColor}
                      disabled={!isAdmin}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className={`font-mono text-sm tracking-widest ${
                        !isValidHex(primaryColor) ? 'border-destructive focus-visible:ring-destructive/30' : ''
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
            <div className="border border-border bg-card rounded-2xl shadow-xl overflow-hidden text-foreground flex flex-col h-[400px]">
              
              {/* Fake Window Header */}
              <div className="bg-muted/70 px-4 py-2 border-b border-border/80 flex items-center gap-1.5 justify-between">
                <div className="flex gap-1.5 items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <div className="text-[10px] font-mono text-muted-foreground bg-background px-8 py-0.5 rounded-md border border-border/50 max-w-[150px] truncate select-none">
                  {activeOrganization?.slug}.easypoint.com
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
                    {activeOrganization?.name || 'Org'}
                  </span>
                </div>
                
                {/* Fake Controls */}
                <div className="flex gap-1.5 items-center">
                  <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                    {currentUiTheme === 'dark' ? <Moon className="h-3 w-3 text-muted-foreground" /> : <Sun className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div className="h-6 w-12 rounded bg-muted/65 text-[9px] font-medium flex items-center justify-center text-muted-foreground leading-none">
                    Salir
                  </div>
                </div>
              </div>

              {/* Mockup Workspace */}
              <div className="flex-1 bg-background p-4 flex gap-4 overflow-hidden">
                
                {/* Fake Sidebar */}
                <div className="w-24 shrink-0 space-y-1.5 border-r border-border/30 pr-2 hidden sm:block">
                  <div className="h-5 w-full rounded bg-brand-500/15 border-l-2 border-brand-500" />
                  <div className="h-5 w-18 rounded bg-muted/30" />
                  <div className="h-5 w-16 rounded bg-muted/30" />
                  <div className="h-5 w-20 rounded bg-muted/30" />
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
                    {/* Simulated Input focused with active theme color */}
                    <div className="h-7 w-full rounded-md border border-brand-500 bg-transparent px-2 flex items-center ring-2 ring-brand-500/20 text-[9px] text-muted-foreground select-none">
                      Texto enfocado...
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Design Help Callout */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 text-muted-foreground text-xs leading-relaxed space-y-1">
              <span className="font-semibold text-foreground block">💡 Tip sobre colores en Tailwind v4</span>
              <p>
                Al cambiar el color hexadecimal, la paleta genera 11 tonos que se inyectan en el DOM. Estos se aplican automáticamente en los estilos que referencian <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-foreground">bg-brand-*</code> o <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded text-foreground">text-brand-*</code>.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
