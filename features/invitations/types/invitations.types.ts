export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  organization?: {
    id: string;
    name: string;
  };
  role: {
    name: string;
  };
}

export interface CreateInvitationDTO {
  email: string;
  role: string; // The role name (e.g. 'ADMINISTRATOR', 'COLLABORATOR', 'USER')
}

export interface CreateAdminInvitationDTO extends CreateInvitationDTO {
  organizationId: string;
}

export interface AcceptInvitationDTO {
  invitationToken: string;
}

export interface FindInvitationsParams {
  search?: string;
  status?: InvitationStatus;
}
