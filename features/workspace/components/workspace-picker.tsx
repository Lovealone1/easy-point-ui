// ─────────────────────────────────────────────────────────────────────────────
// features/workspace/components/workspace-picker.tsx
//
// Where every login lands. A user may belong to organizations, have a personal
// space, or both — only they can say which one they meant to open, so this is
// always shown rather than guessing.
//
// Picking an organization does here exactly what use-session-recovery does on a
// cold load (setActiveOrganization → setOrganizationConfig → applyBrandingToDOM),
// plus it records the choice in a cookie so a later reload re-derives the same
// organization instead of snapping back to the first membership.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Building2, LogOut, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { PageLoader } from '@/shared/components/ui/spinner';
import { useAuthStore } from '@/shared/store/use-auth-store';
import { useUiStore } from '@/shared/store/use-ui-store';
import { getMe } from '@/features/auth/services/auth.service';
import { userOnboardingService } from '@/features/user-onboarding/services/user-onboarding.service';
import { applyBrandingToDOM, forceLogout } from '@/shared/utils/apply-branding';
import { writePreferredOrgId, type OrgMembershipCandidate } from '@/shared/utils/resolve-active-org';

interface WorkspaceState {
  organizations: OrgMembershipCandidate[];
  /** Whether the user has finished the personal-space onboarding. */
  personalReady: boolean;
}

export function WorkspacePicker() {
  const router = useRouter();
  const setUserFromLogin = useAuthStore((s) => s.setUserFromLogin);
  const hydrateProfile = useAuthStore((s) => s.hydrateProfile);
  const setActiveOrganization = useAuthStore((s) => s.setActiveOrganization);
  const setOrganizationConfig = useAuthStore((s) => s.setOrganizationConfig);
  const setTheme = useUiStore((s) => s.setTheme);

  const [state, setState] = React.useState<WorkspaceState | null>(null);
  const [userName, setUserName] = React.useState<string>('');

  React.useEffect(() => {
    async function load() {
      try {
        const data = await getMe();
        if (!data?.id) {
          router.replace('/auth');
          return;
        }

        setUserFromLogin({ id: data.id, email: data.email });
        hydrateProfile({
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          fullName:
            data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null,
          avatarUrl: undefined,
          globalRole: data.globalRole || null,
        });
        setUserName(data.firstName || data.email || '');

        // /auth/me already carries every membership with its role, permissions
        // and branding config, so the picker needs no extra endpoint. Only the
        // personal-space status has to be asked for separately.
        let personalReady = false;
        try {
          personalReady = (await userOnboardingService.getState()).completed;
        } catch {
          // Preferences unreachable — treat the personal space as not set up.
        }

        const organizations: OrgMembershipCandidate[] = data.organizations ?? [];

        // Nothing to choose between: a brand-new user goes straight to setup.
        if (organizations.length === 0 && !personalReady) {
          router.replace('/onboarding');
          return;
        }

        setState({ organizations, personalReady });
      } catch {
        router.replace('/auth');
      }
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enterOrganization(org: OrgMembershipCandidate) {
    setActiveOrganization(
      { id: org.id, name: org.name, slug: org.slug },
      { orgRoles: [org.role], permissions: org.permissions ?? [] }
    );

    if (org.config) {
      setOrganizationConfig(org.config);
      applyBrandingToDOM(org.config, setTheme);
    }

    writePreferredOrgId(org.id);
    router.push('/dashboard');
  }

  if (!state) {
    return <PageLoader label="Cargando tus espacios..." />;
  }

  const { organizations, personalReady } = state;

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl space-y-8">
          <header className="text-center space-y-4">
            <Image
              src="/global/easypoint-logo.png"
              alt="EasyPoint"
              width={160}
              height={44}
              className="object-contain w-auto h-10 mx-auto"
              priority
            />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {userName ? `Hola, ${userName}` : 'Elige dónde quieres entrar'}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Elige el espacio con el que quieres trabajar. Puedes cambiar cuando quieras.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {organizations.map((org) => (
              <OrganizationCard key={org.id} org={org} onSelect={() => enterOrganization(org)} />
            ))}

            <WorkspaceCard
              icon={<Sparkles className="w-6 h-6" />}
              title="Mi espacio personal"
              description={
                personalReady
                  ? 'Tus suscripciones, cuánto pagas y cuándo se renuevan.'
                  : 'Aún no lo has configurado. Toma menos de un minuto.'
              }
              cta={personalReady ? 'Entrar' : 'Configurar'}
              onSelect={() =>
                router.push(personalReady ? '/personal/dashboard' : '/onboarding?space=personal')
              }
            />

            {organizations.length === 0 && (
              <WorkspaceCard
                icon={<Plus className="w-6 h-6" />}
                title="Crear una organización"
                description="Inventario, ventas y finanzas para tu negocio. 7 días de prueba con acceso completo."
                cta="Empezar"
                onSelect={() => router.push('/onboarding')}
              />
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void forceLogout()}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganizationCard({
  org,
  onSelect,
}: {
  org: OrgMembershipCandidate;
  onSelect: () => void;
}) {
  const logoUrl = org.config?.logoUrl ?? null;
  const plan = org.config?.plan ?? null;
  const initial = org.name.charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col items-start text-left p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-center gap-3 w-full mb-4">
        <div className="w-12 h-12 rounded-xl border border-border/50 bg-background grid place-items-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL, outside next/image's configured domains
            <img src={logoUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="font-bold text-lg text-foreground select-none">{initial}</span>
          )}
        </div>
        {plan && (
          <span
            className={cn(
              'ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
              plan === 'PREMIUM'
                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                : plan === 'BASIC'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : 'bg-muted text-muted-foreground border-border/40'
            )}
          >
            {plan}
          </span>
        )}
      </div>

      <h2 className="text-base font-bold text-foreground mb-1 truncate w-full">{org.name}</h2>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Building2 className="w-3 h-3" />
        {org.role}
      </p>

      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        Entrar <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function WorkspaceCard({
  icon,
  title,
  description,
  cta,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col items-start text-left p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 mb-4 group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h2 className="text-base font-bold text-foreground mb-1.5">{title}</h2>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
        {cta} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
