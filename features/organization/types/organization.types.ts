export type Plan = 'FREE' | 'BASIC' | 'PREMIUM';

export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'FROZEN';

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  plan: Plan;
  planActiveUntil: string | null;
  status: OrganizationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
