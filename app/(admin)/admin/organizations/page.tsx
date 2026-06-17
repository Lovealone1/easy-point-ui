"use client";

import { useState, useEffect } from 'react';
import {
  useOrganizationsAdmin,
  useCreateOrganization,
  useUpdateOrganization,
  useUpdateOrganizationPlan,
  useDeleteOrganization,
} from '@/features/organization/hooks/use-organizations-admin';
import type { Organization, Plan, OrganizationStatus } from '@/features/organization/types/organization.types';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/ui/select';
import { ConfirmModal } from '@/shared/components/ui/confirm-modal';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2,
  Mail,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  CalendarCheck,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals visibility state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<OrganizationStatus>('ACTIVE');
  const [orgPlan, setOrgPlan] = useState<Plan>('FREE');
  const [planActiveUntil, setPlanActiveUntil] = useState('');
  
  // Validation Errors
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});

  // Mutations
  const createMutation = useCreateOrganization();
  const updateMutation = useUpdateOrganization();
  const updatePlanMutation = useUpdateOrganizationPlan();
  const deleteMutation = useDeleteOrganization();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch organizations
  const { data, isLoading, error, refetch } = useOrganizationsAdmin({
    search: debouncedSearch,
    limit: 50,
  });

  const getPlanStyles = (plan: string) => {
    switch (plan) {
      case 'PREMIUM':
        return 'bg-brand-500/10 text-brand-500 border-brand-500/20';
      case 'BASIC':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
          label: 'Activa',
        };
      case 'FROZEN':
        return {
          bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
          label: 'Congelada',
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
          dot: 'bg-rose-500',
          icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
          label: 'Inactiva',
        };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatPlanActiveUntil = (dateString: string | null, plan: string) => {
    if (plan === 'FREE') return 'Permanente';
    if (!dateString) return 'No definida';
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Click Handlers for Modals
  const handleCreateClick = () => {
    setSelectedOrg(null);
    setName('');
    setEmail('');
    setSlug('');
    setStatus('ACTIVE');
    setDetailErrors({});
    setIsFormOpen(true);
  };

  const handleEditClick = (org: Organization) => {
    setSelectedOrg(org);
    setName(org.name);
    setEmail(org.email || '');
    setSlug(org.slug || '');
    setStatus(org.status);
    setDetailErrors({});
    setIsFormOpen(true);
  };

  const handleEditPlanClick = (org: Organization) => {
    setSelectedOrg(org);
    setOrgPlan(org.plan);
    setPlanActiveUntil(org.planActiveUntil ? org.planActiveUntil.slice(0, 10) : '');
    setPlanErrors({});
    setIsPlanOpen(true);
  };

  const handleDeleteClick = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteOpen(true);
  };

  // Validations
  const validateDetails = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'El nombre es obligatorio';
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) errs.email = 'El correo electrónico no es válido';
    if (slug.trim() && !/^[a-z0-9-]+$/.test(slug)) errs.slug = 'El slug solo permite letras minúsculas, números y guiones';
    
    setDetailErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePlan = () => {
    const errs: Record<string, string> = {};
    if (orgPlan !== 'FREE' && !planActiveUntil) {
      errs.planActiveUntil = 'La fecha de vencimiento es obligatoria para planes de pago';
    }
    setPlanErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submit Handlers
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;

    const payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      slug: slug.trim() || undefined,
      status,
    };

    if (selectedOrg) {
      // Edit mode
      updateMutation.mutate(
        { id: selectedOrg.id, payload },
        {
          onSuccess: () => {
            toast.success('Organización actualizada con éxito');
            setIsFormOpen(false);
          },
          onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al actualizar la organización');
          },
        }
      );
    } else {
      // Create mode
      createMutation.mutate(
        payload,
        {
          onSuccess: () => {
            toast.success('Organización creada con éxito');
            setIsFormOpen(false);
          },
          onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al crear la organización');
          },
        }
      );
    }
  };

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePlan()) return;

    if (!selectedOrg) return;

    updatePlanMutation.mutate(
      {
        id: selectedOrg.id,
        payload: {
          plan: orgPlan,
          planActiveUntil: orgPlan === 'FREE' ? null : new Date(planActiveUntil).toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success('Plan de organización actualizado con éxito');
          setIsPlanOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Error al actualizar el plan');
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!selectedOrg) return;

    deleteMutation.mutate(selectedOrg.id, {
      onSuccess: () => {
        toast.success('Organización eliminada con éxito');
        setIsDeleteOpen(false);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Error al eliminar la organización');
      },
    });
  };

  const organizations = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            type="text"
            placeholder="Buscar organización por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 text-xs border-border bg-card focus-visible:ring-brand-500 placeholder:text-muted-foreground/50 shadow-sm"
          />
        </div>
        <button
          onClick={handleCreateClick}
          className="bg-brand-500 hover:bg-brand-600 text-white rounded-[11px] gap-1.5 flex items-center justify-center px-4 h-10 transition-all duration-150 active:scale-95 cursor-pointer text-xs font-semibold shadow-xs shrink-0"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Nueva Organización
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <span className="text-xs text-muted-foreground font-medium">Buscando organizaciones...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Error al cargar datos</h3>
            <p className="text-[11px] text-muted-foreground">
              No pudimos conectar con el servidor. Por favor, intenta de nuevo.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline"
          >
            Reintentar consulta
          </button>
        </div>
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Sin resultados</h3>
            <p className="text-[11px] text-muted-foreground">
              No encontramos organizaciones que coincidan con la búsqueda actual.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org) => {
            const statusConfig = getStatusStyles(org.status);
            return (
              <div
                key={org.id}
                className="group relative flex flex-col justify-between overflow-hidden p-5 rounded-2xl border border-border/80 bg-card hover:border-brand-500/35 hover:shadow-md transition-all duration-300 shadow-sm"
              >
                {/* Background ambient light */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Top Section: Avatar & Header */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-500/5 border border-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-base select-none shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-foreground truncate group-hover:text-brand-500 transition-colors leading-tight">
                          {org.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground min-w-0">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span className="truncate">{org.slug}.easypoint.app</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border select-none",
                        statusConfig.bg
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusConfig.dot)} />
                        <span>{statusConfig.label}</span>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditClick(org); }}
                          title="Editar detalles"
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 active:scale-90 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditPlanClick(org); }}
                          title="Cambiar plan"
                          className="p-1 rounded-lg text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                        >
                          <CalendarCheck className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteClick(org); }}
                          title="Eliminar organización"
                          className="p-1 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2.5 pt-1.5 text-[11px] text-muted-foreground">
                    {/* Owner Email */}
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      {org.email ? (
                        <span className="truncate text-foreground/80">{org.email}</span>
                      ) : (
                        <span className="italic text-muted-foreground/40">Sin email</span>
                      )}
                    </div>

                    {/* Creation Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      <span>Creado el: <span className="text-foreground/85">{formatDate(org.createdAt)}</span></span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Plan badge and renewal */}
                <div className="mt-5 pt-3.5 border-t border-border/60 flex items-center justify-between gap-4 text-[10px]">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground/85 font-medium">Plan asignado:</span>
                    <span className={cn(
                      "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold border mt-1 max-w-max",
                      getPlanStyles(org.plan)
                    )}>
                      {org.plan}
                    </span>
                  </div>

                  <div className="flex flex-col items-end text-right">
                    <span className="text-muted-foreground/85 font-medium">Vence:</span>
                    <span className="text-foreground/85 font-semibold mt-1">
                      {formatPlanActiveUntil(org.planActiveUntil, org.plan)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* dialogs & modals */}

      {/* details dialog (Create / Edit) */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-6 gap-6">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-heading font-semibold text-foreground">
              {selectedOrg ? 'Editar Organización' : 'Nueva Organización'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedOrg 
                ? 'Modifica los datos principales de la organización registrada.' 
                : 'Crea una nueva organización en la plataforma con plan inicial gratuito.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-name" className="text-xs font-bold text-muted-foreground/90">
                  Nombre de la Organización <span className="text-destructive font-bold">*</span>
                </Label>
                <Input
                  id="org-name"
                  placeholder="Ej. Mi Negocio S.A.S"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (detailErrors.name) setDetailErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  aria-invalid={!!detailErrors.name}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                {detailErrors.name && (
                  <span className="text-xs text-destructive mt-0.5">{detailErrors.name}</span>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-email" className="text-xs font-bold text-muted-foreground/90">
                  Correo Electrónico de Contacto
                </Label>
                <Input
                  id="org-email"
                  type="email"
                  placeholder="Ej. contacto@minegocio.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (detailErrors.email) setDetailErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  aria-invalid={!!detailErrors.email}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                {detailErrors.email && (
                  <span className="text-xs text-destructive mt-0.5">{detailErrors.email}</span>
                )}
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-slug" className="text-xs font-bold text-muted-foreground/90">
                  Subdominio / Slug
                </Label>
                <Input
                  id="org-slug"
                  placeholder="Ej. mi-negocio"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    if (detailErrors.slug) setDetailErrors((prev) => ({ ...prev, slug: '' }));
                  }}
                  aria-invalid={!!detailErrors.slug}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                {detailErrors.slug && (
                  <span className="text-xs text-destructive mt-0.5">{detailErrors.slug}</span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  Se utilizará para la URL: <strong>{slug || 'slug'}.easypoint.app</strong>
                </span>
              </div>

              {/* Status (Only in Edit mode) */}
              {selectedOrg && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="org-status" className="text-xs font-bold text-muted-foreground/90">
                    Estado de la Organización <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as OrganizationStatus)}
                    disabled={updateMutation.isPending}
                  >
                    <SelectTrigger
                      id="org-status"
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground"
                    >
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg">
                      <SelectItem value="ACTIVE" className="rounded-lg text-xs py-2 cursor-pointer">Activa</SelectItem>
                      <SelectItem value="INACTIVE" className="rounded-lg text-xs py-2 cursor-pointer">Inactiva</SelectItem>
                      <SelectItem value="FROZEN" className="rounded-lg text-xs py-2 cursor-pointer">Congelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {selectedOrg ? 'Guardar Cambios' : 'Crear Organización'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Plan edit dialog */}
      <Dialog open={isPlanOpen} onOpenChange={(open) => !open && setIsPlanOpen(false)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-6 gap-6">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-heading font-semibold text-foreground">
              Gestionar Plan de Suscripción
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Modifica la suscripción comercial y fecha de vencimiento para <strong>{selectedOrg?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePlanSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Plan Select */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="org-plan-select" className="text-xs font-bold text-muted-foreground/90">
                  Plan de Suscripción <span className="text-destructive font-bold">*</span>
                </Label>
                <Select
                  value={orgPlan}
                  onValueChange={(val) => {
                    setOrgPlan(val as Plan);
                    if (val === 'FREE') setPlanActiveUntil('');
                    if (planErrors.planActiveUntil) setPlanErrors({});
                  }}
                  disabled={updatePlanMutation.isPending}
                >
                  <SelectTrigger
                    id="org-plan-select"
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground"
                  >
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg">
                    <SelectItem value="FREE" className="rounded-lg text-xs py-2 cursor-pointer">FREE (Permanente)</SelectItem>
                    <SelectItem value="BASIC" className="rounded-lg text-xs py-2 cursor-pointer">BASIC (Pago)</SelectItem>
                    <SelectItem value="PREMIUM" className="rounded-lg text-xs py-2 cursor-pointer">PREMIUM (Pago)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* planActiveUntil Date Input */}
              {orgPlan !== 'FREE' && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="org-plan-date" className="text-xs font-bold text-muted-foreground/90">
                    Fecha de Vencimiento <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="org-plan-date"
                    type="date"
                    value={planActiveUntil}
                    onChange={(e) => {
                      setPlanActiveUntil(e.target.value);
                      if (planErrors.planActiveUntil) setPlanErrors((prev) => ({ ...prev, planActiveUntil: '' }));
                    }}
                    aria-invalid={!!planErrors.planActiveUntil}
                    disabled={updatePlanMutation.isPending}
                  />
                  {planErrors.planActiveUntil && (
                    <span className="text-xs text-destructive mt-0.5">{planErrors.planActiveUntil}</span>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPlanOpen(false)}
                disabled={updatePlanMutation.isPending}
                className="px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updatePlanMutation.isPending}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {updatePlanMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Actualizar Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar Organización?"
        description={`Esta acción eliminará de forma permanente la organización "${selectedOrg?.name}". Se perderán todos los datos vinculados de insumos, stock, usuarios, y facturación.`}
        confirmLabel="Eliminar Organización"
        cancelLabel="Cancelar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
