export type AdminDashboardGranularity = 'today' | 'month' | 'year' | 'range';

export interface FindAdminDashboardParams {
  granularity?: AdminDashboardGranularity;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

export interface TrendItem {
  label: string;
  organizations: number;
  salesCount: number;
  salesVolume: number;
}

export interface PlanDistribution {
  plan: 'FREE' | 'BASIC' | 'PREMIUM';
  count: number;
}

export interface ModuleDistribution {
  key: string;
  name: string;
  count: number;
}

export interface RecentOrganization {
  id: string;
  name: string;
  email: string | null;
  plan: 'FREE' | 'BASIC' | 'PREMIUM';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface RecentUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  globalRole: 'ADMIN' | 'MODERATOR' | 'USER';
  isActive: boolean;
  createdAt: string;
}

export interface AdminDashboardStats {
  kpis: {
    period: {
      organizationsCreated: number;
      usersRegistered: number;
      salesCount: number;
      salesVolume: number;
      invitationsSent: number;
    };
    total: {
      organizations: number;
      users: number;
      salesCount: number;
      salesVolume: number;
      pendingInvitations: number;
    };
  };
  trends: TrendItem[];
  planDistribution: PlanDistribution[];
  moduleDistribution: ModuleDistribution[];
  recentOrganizations: RecentOrganization[];
  recentUsers: RecentUser[];
}
