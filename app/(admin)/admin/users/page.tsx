"use client";

import * as React from 'react';
import { toast } from 'sonner';
import {
  DataTable,
  ColumnDef,
} from '@/shared/components/ui/data-table';
import { DataTableSearch } from '@/shared/components/ui/data-table-search';
import { DataTableToolbar } from '@/shared/components/ui/data-table-toolbar';
import {
  useUsers,
  useUpdateUser,
  useUpdateUserRole,
  useDeleteUser,
  useRequestUserEmailOtp,
  useVerifyUserEmailOtp,
} from '@/features/users/hooks/use-users';
import type { User, GlobalRole } from '@/features/users/types/users.types';
import { Input } from '@/shared/components/ui/input';
import {
  Pencil,
  Shield,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

// Shared modal components
import { DynamicFormModal, FormFieldSchema } from '@/shared/components/ui/dynamic-form-modal';
import { ConfirmModal } from '@/shared/components/ui/confirm-modal';
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

export default function AdminUsersPage() {
  const router = useRouter();
  // Query and Mutation Hooks
  const updateUserMutation = useUpdateUser();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();
  const requestEmailOtpMutation = useRequestUserEmailOtp();
  const verifyEmailOtpMutation = useVerifyUserEmailOtp();

  // Modals Visibility and Selected Record State
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isRoleOpen, setIsRoleOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isEmailOpen, setIsEmailOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  // Custom role state
  const [roleValue, setRoleValue] = React.useState<GlobalRole>('USER');

  // Custom email change states
  const [emailStep, setEmailStep] = React.useState<1 | 2>(1);
  const [newEmailValue, setNewEmailValue] = React.useState('');
  const [otpValue, setOtpValue] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [otpError, setOtpError] = React.useState('');

  // Query Filters state
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [sortKey, setSortKey] = React.useState<string>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Debounce search query to prevent excessive API requests
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset to first page when search filter changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch paginated users from BFF proxy
  const { data: usersResponse, isLoading, error, refetch } = useUsers({
    page,
    limit: 8,
    orderBy: sortKey,
    order: sortOrder === 'asc' ? 'ASC' : 'DESC',
    search: debouncedSearch || undefined,
  });

  // Display error toast if fetching fails
  React.useEffect(() => {
    if (error) {
      toast.error('Error al cargar usuarios', {
        description: error instanceof Error ? error.message : 'Intente nuevamente más tarde.',
      });
    }
  }, [error]);

  // Form Fields for editing user profile (excluding email and role)
  const userFields = React.useMemo<FormFieldSchema[]>(() => [
    {
      name: 'firstName',
      label: 'Nombre',
      type: 'text',
      placeholder: 'Ej. Juan',
      required: true,
      gridCols: 1,
    },
    {
      name: 'lastName',
      label: 'Apellido',
      type: 'text',
      placeholder: 'Ej. Pérez',
      required: true,
      gridCols: 1,
    },
    {
      name: 'phoneNumber',
      label: 'Teléfono',
      type: 'text',
      placeholder: 'Ej. +573001234567',
      required: false,
      gridCols: 2,
    },
    {
      name: 'isActive',
      label: 'Estado de Cuenta Activo',
      type: 'boolean',
      placeholder: 'Habilita o deshabilita el acceso del usuario al sistema',
      required: false,
      gridCols: 2,
    },
  ], []);

  // Handle column header clicks for API sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Helper for formatting date strings
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Helper to resolve role color badges
  const getRoleBadgeStyles = (role: GlobalRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20';
      case 'MODERATOR':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getRoleLabel = (role: GlobalRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'MODERATOR':
        return 'Moderador';
      default:
        return 'Usuario';
    }
  };

  // Column definitions matching dashboard aesthetics
  const columns: ColumnDef<User>[] = [
    {
      key: 'name',
      header: 'Usuario',
      sortable: false,
      className: 'font-medium text-foreground min-w-[200px]',
      render: (row) => {
        const fullName = [row.firstName, row.lastName].filter(Boolean).join(' ');
        return (
          <div className="flex flex-col py-0.5 min-w-0">
            <span className="font-semibold text-foreground leading-snug truncate">
              {fullName || 'Usuario Registrado'}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
              <Mail className="h-3 w-3 shrink-0" />
              {row.email}
            </span>
          </div>
        );
      },
    },
    {
      key: 'globalRole',
      header: 'Rol Global',
      sortable: true,
      className: 'min-w-[130px]',
      render: (row) => (
        <span className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border select-none',
          getRoleBadgeStyles(row.globalRole)
        )}>
          <Shield className="h-3 w-3 shrink-0" />
          <span>{getRoleLabel(row.globalRole)}</span>
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Estado',
      sortable: true,
      className: 'min-w-[100px]',
      render: (row) => (
        <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border select-none',
          row.isActive
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        )}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Teléfono',
      sortable: false,
      render: (row) => (
        <div className="flex items-center gap-1 text-sm text-foreground/80 font-mono">
          {row.phoneNumber ? (
            <>
              <Phone className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span>{row.phoneNumber}</span>
            </>
          ) : (
            <span className="text-muted-foreground/50 italic font-sans">Sin teléfono</span>
          )}
        </div>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Último Acceso',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span>{formatDate(row.lastLoginAt)}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Fecha Registro',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
          <span>{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'center',
      className: 'w-[170px]',
      render: (row) => {
        const isEditing = updateUserMutation.isPending && updateUserMutation.variables?.id === row.id;
        const isRoleUpdating = updateRoleMutation.isPending && updateRoleMutation.variables?.id === row.id;
        const isDeleting = deleteUserMutation.isPending && deleteUserMutation.variables === row.id;
        const isEmailRequesting = requestEmailOtpMutation.isPending && requestEmailOtpMutation.variables?.id === row.id;
        const isEmailVerifying = verifyEmailOtpMutation.isPending && verifyEmailOtpMutation.variables?.id === row.id;
        const isEmailPending = isEmailRequesting || isEmailVerifying;

        return (
          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Editar Perfil */}
            <button
              onClick={() => {
                setSelectedUser(row);
                setIsEditOpen(true);
              }}
              disabled={isEditing || isEmailPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Editar perfil"
            >
              {isEditing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Cambiar Email */}
            <button
              onClick={() => {
                setSelectedUser(row);
                setNewEmailValue(row.email);
                setEmailStep(1);
                setIsEmailOpen(true);
              }}
              disabled={isEditing || isEmailPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Modificar correo electrónico"
            >
              {isEmailPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Asignar Rol */}
            <button
              onClick={() => {
                setSelectedUser(row);
                setRoleValue(row.globalRole);
                setIsRoleOpen(true);
              }}
              disabled={isRoleUpdating || isEmailPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Cambiar rol global"
            >
              {isRoleUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Shield className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Facturación Electrónica */}
            <button
              onClick={() => {
                router.push(`/admin/user-info/${row.id}`);
              }}
              disabled={isEmailPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-500 hover:bg-brand-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Configurar facturación electrónica"
            >
              <FileText className="h-3.5 w-3.5" />
            </button>

            {/* Eliminar Cuenta */}
            <button
              onClick={() => {
                setSelectedUser(row);
                setIsDeleteOpen(true);
              }}
              disabled={isDeleting || isEmailPending}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all duration-150 active:scale-90 cursor-pointer disabled:opacity-50"
              title="Eliminar usuario"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  // Submit profile changes
  const handleProfileSubmit = (values: Record<string, any>) => {
    if (!selectedUser) return;

    // Filter to only send modified fields (dirty-field diffing)
    const patchPayload: Record<string, any> = {};
    Object.keys(values).forEach((key) => {
      const newValue = values[key];
      const oldValue = (selectedUser as any)[key];

      const isOldFalsy = oldValue === null || oldValue === undefined || oldValue === '';
      const isNewFalsy = newValue === null || newValue === undefined || newValue === '';

      if (isOldFalsy && isNewFalsy) return;

      if (newValue !== oldValue) {
        patchPayload[key] = newValue;
      }
    });

    if (Object.keys(patchPayload).length === 0) {
      toast.info('No se realizaron modificaciones');
      setIsEditOpen(false);
      setSelectedUser(null);
      return;
    }

    updateUserMutation.mutate(
      { id: selectedUser.id, payload: patchPayload },
      {
        onSuccess: () => {
          toast.success('Usuario actualizado con éxito');
          setIsEditOpen(false);
          setSelectedUser(null);
        },
        onError: (err) => {
          toast.error('Error al actualizar el usuario', {
            description: err instanceof Error ? err.message : 'Intente nuevamente.',
          });
        },
      }
    );
  };

  // Submit role reassignment
  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (roleValue === selectedUser.globalRole) {
      toast.info('El usuario ya cuenta con ese rol');
      setIsRoleOpen(false);
      setSelectedUser(null);
      return;
    }

    updateRoleMutation.mutate(
      { id: selectedUser.id, role: roleValue },
      {
        onSuccess: () => {
          toast.success('Rol global actualizado con éxito');
          setIsRoleOpen(false);
          setSelectedUser(null);
        },
        onError: (err) => {
          toast.error('Error al actualizar el rol global', {
            description: err instanceof Error ? err.message : 'Intente nuevamente.',
          });
        },
      }
    );
  };

  // Submit deletion
  const handleDeleteConfirm = () => {
    if (!selectedUser) return;

    deleteUserMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        toast.success('Usuario eliminado correctamente');
        setIsDeleteOpen(false);
        setSelectedUser(null);
      },
      onError: (err) => {
        toast.error('Error al eliminar el usuario', {
          description: err instanceof Error ? err.message : 'Intente nuevamente.',
        });
      },
    });
  };

  const handleEmailClose = () => {
    setIsEmailOpen(false);
    setSelectedUser(null);
    setNewEmailValue('');
    setOtpValue('');
    setEmailError('');
    setOtpError('');
    setEmailStep(1);
  };

  const handleEmailRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const trimmedEmail = newEmailValue.trim();
    if (!trimmedEmail) {
      setEmailError('El correo electrónico es obligatorio');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setEmailError('Formato de correo electrónico inválido');
      return;
    }

    if (trimmedEmail.toLowerCase() === selectedUser.email.toLowerCase()) {
      setEmailError('El nuevo correo debe ser diferente al actual');
      return;
    }

    requestEmailOtpMutation.mutate(
      { id: selectedUser.id, newEmail: trimmedEmail },
      {
        onSuccess: () => {
          toast.success(`Código OTP enviado al correo: ${trimmedEmail}`);
          setEmailStep(2);
        },
        onError: (err) => {
          toast.error('Error al solicitar código OTP', {
            description: err instanceof Error ? err.message : 'Intente nuevamente.',
          });
        },
      }
    );
  };

  const handleEmailVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const trimmedEmail = newEmailValue.trim();
    const trimmedOtp = otpValue.trim();

    if (trimmedOtp.length !== 6) {
      setOtpError('El código OTP debe ser de 6 dígitos');
      return;
    }

    verifyEmailOtpMutation.mutate(
      { id: selectedUser.id, newEmail: trimmedEmail, otp: trimmedOtp },
      {
        onSuccess: () => {
          toast.success('Correo electrónico actualizado con éxito', {
            description: 'Las sesiones activas del usuario se han cerrado por seguridad.',
          });
          handleEmailClose();
          refetch();
        },
        onError: (err) => {
          toast.error('Error al cambiar correo electrónico', {
            description: err instanceof Error ? err.message : 'Verifique el código e intente de nuevo.',
          });
        },
      }
    );
  };

  const handleResendOtp = () => {
    if (!selectedUser) return;
    const trimmedEmail = newEmailValue.trim();
    requestEmailOtpMutation.mutate(
      { id: selectedUser.id, newEmail: trimmedEmail },
      {
        onSuccess: () => {
          toast.success(`Código OTP reenviado a: ${trimmedEmail}`);
        },
        onError: (err) => {
          toast.error('Error al reenviar código OTP', {
            description: err instanceof Error ? err.message : 'Intente nuevamente.',
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Toolbar (No new button since users register autonomously) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DataTableToolbar
          searchSection={
            <DataTableSearch
              value={search}
              onChange={setSearch}
              placeholder="Buscar usuarios por nombre o email..."
              shortcutKey="/"
              shape="md"
            />
          }
        />
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <span className="text-xs text-muted-foreground font-medium">Cargando usuarios...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="max-w-xs space-y-1">
            <h3 className="text-xs font-bold text-foreground">Error al cargar datos</h3>
            <p className="text-[11px] text-muted-foreground">
              No pudimos establecer comunicación con el servidor.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline cursor-pointer"
          >
            Reintentar consulta
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={usersResponse?.data || []}
          loading={isLoading}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          pagination={{
            currentPage: page,
            totalPages: usersResponse?.meta?.pageCount || 1,
            onPageChange: setPage,
            totalItems: usersResponse?.meta?.itemCount || 0,
            itemsPerPage: 8,
          }}
          onRowClick={(row) => {
            setSelectedUser(row);
            setIsEditOpen(true);
          }}
          glassy={true}
        />
      )}

      {/* Dialogs and Modals */}

      {/* Profile Edit Modal */}
      <DynamicFormModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedUser(null);
        }}
        title="Editar Perfil de Usuario"
        description="Actualiza la información de perfil básica de esta cuenta."
        fields={userFields}
        submitLabel="Guardar Cambios"
        defaultValues={selectedUser || undefined}
        isLoading={updateUserMutation.isPending}
        onSubmit={handleProfileSubmit}
      />

      {/* Global Role Change Modal */}
      <Dialog open={isRoleOpen} onOpenChange={(open) => !open && setIsRoleOpen(false)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-6 gap-6">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-heading font-semibold text-foreground">
              Modificar Rol Global
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Modifica los privilegios globales del usuario <strong>{selectedUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRoleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user-role-select" className="text-xs font-bold text-muted-foreground/90">
                  Rol del Sistema <span className="text-destructive font-bold">*</span>
                </Label>
                <Select
                  value={roleValue}
                  onValueChange={(val) => setRoleValue(val as GlobalRole)}
                  disabled={updateRoleMutation.isPending}
                >
                  <SelectTrigger
                    id="user-role-select"
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground"
                  >
                    <SelectValue placeholder="Seleccionar rol global" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[180px] rounded-xl p-1 bg-popover border border-border/25 shadow-lg">
                    <SelectItem value="USER" className="rounded-lg text-xs py-2 cursor-pointer">
                      Usuario (USER)
                    </SelectItem>
                    <SelectItem value="MODERATOR" className="rounded-lg text-xs py-2 cursor-pointer">
                      Moderador (MODERATOR)
                    </SelectItem>
                    <SelectItem value="ADMIN" className="rounded-lg text-xs py-2 cursor-pointer">
                      Administrador (ADMIN)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRoleOpen(false);
                  setSelectedUser(null);
                }}
                disabled={updateRoleMutation.isPending}
                className="px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateRoleMutation.isPending}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {updateRoleMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Actualizar Rol
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar Cuenta de Usuario?"
        description={`Esta acción eliminará de forma permanente la cuenta asociada a "${selectedUser?.email}". Se perderá todo el acceso del usuario a las organizaciones de la plataforma.`}
        confirmLabel="Eliminar Cuenta"
        cancelLabel="Cancelar"
        isLoading={deleteUserMutation.isPending}
        variant="danger"
      />

      {/* Global Email Change Modal */}
      <Dialog open={isEmailOpen} onOpenChange={(open) => !open && handleEmailClose()}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl bg-card border border-border/40 shadow-xl p-6 gap-6">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-heading font-semibold text-foreground">
              Modificar Correo Electrónico
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {emailStep === 1
                ? `Ingresa la nueva dirección de correo para ${selectedUser?.email}. Se enviará un código OTP de verificación.`
                : `Ingresa el código OTP de 6 dígitos enviado a ${newEmailValue} para confirmar el cambio.`
              }
            </DialogDescription>
          </DialogHeader>

          {emailStep === 1 ? (
            <form onSubmit={handleEmailRequestSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-email" className="text-xs font-bold text-muted-foreground/90">
                    Nuevo Correo Electrónico <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="Ej. usuario.nuevo@correo.com"
                    value={newEmailValue}
                    onChange={(e) => {
                      setNewEmailValue(e.target.value);
                      setEmailError('');
                    }}
                    disabled={requestEmailOtpMutation.isPending}
                    className="h-10 text-sm"
                  />
                  {emailError && (
                    <span className="text-xs text-destructive mt-0.5">{emailError}</span>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEmailClose}
                  disabled={requestEmailOtpMutation.isPending}
                  className="px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={requestEmailOtpMutation.isPending}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {requestEmailOtpMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Enviar Código OTP
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleEmailVerifySubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email-otp" className="text-xs font-bold text-muted-foreground/90">
                    Código OTP de Verificación <span className="text-destructive font-bold">*</span>
                  </Label>
                  <Input
                    id="email-otp"
                    type="text"
                    maxLength={6}
                    placeholder="Ej. 123456"
                    value={otpValue}
                    onChange={(e) => {
                      setOtpValue(e.target.value.replace(/\D/g, ''));
                      setOtpError('');
                    }}
                    disabled={verifyEmailOtpMutation.isPending}
                    className="h-10 text-center text-lg tracking-widest font-bold"
                  />
                  {otpError && (
                    <span className="text-xs text-destructive mt-0.5">{otpError}</span>
                  )}
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={requestEmailOtpMutation.isPending || verifyEmailOtpMutation.isPending}
                    className="text-xs text-brand-500 hover:text-brand-600 hover:underline font-semibold disabled:opacity-50"
                  >
                    {requestEmailOtpMutation.isPending ? 'Enviando código...' : '¿No recibiste el código? Reenviar OTP'}
                  </button>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-6 border-t border-border/40 pt-4 flex flex-row items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmailStep(1)}
                  disabled={verifyEmailOtpMutation.isPending}
                  className="px-4 py-2 hover:bg-muted/50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  disabled={verifyEmailOtpMutation.isPending}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {verifyEmailOtpMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Confirmar Cambio
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
