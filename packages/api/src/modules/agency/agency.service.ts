import {
  IAgencyRepository,
  IAgencyInviteRepository,
  CreateAgencyInput,
  UpdateAgencyInput,
  AgencyRecord,
  AgencyMember,
} from './agency.types';
import {
  AgencyNotFoundError,
  AgencyAlreadyExistsError,
  NotAgencyOwnerError,
  AgentNotInAgencyError,
  CannotRemoveSelfError,
  AdminCannotLeaveError,
  ForbiddenRoleError,
} from './agency.errors';

export class AgencyService {
  constructor(
    private readonly agencyRepo: IAgencyRepository,
    private readonly inviteRepo: IAgencyInviteRepository,
  ) {}

  async createAgency(userId: string, userRole: string, input: CreateAgencyInput): Promise<AgencyRecord> {
    if (userRole !== 'agency_admin' && userRole !== 'super_admin') {
      throw new ForbiddenRoleError('agency_admin');
    }

    const existing = await this.agencyRepo.findAgencyByAdminId(userId);
    if (existing) {
      throw new AgencyAlreadyExistsError();
    }

    return this.agencyRepo.createAgency({ ...input, adminId: userId });
  }

  async getAgency(agencyId: string, userId: string): Promise<AgencyRecord> {
    const agency = await this.agencyRepo.findAgencyById(agencyId);
    if (!agency) {
      throw new AgencyNotFoundError();
    }
    return agency;
  }

  async updateAgency(agencyId: string, userId: string, input: UpdateAgencyInput): Promise<AgencyRecord> {
    const agency = await this.requireAgency(agencyId);
    this.requireAdmin(agency, userId);
    return this.agencyRepo.updateAgency(agencyId, input);
  }

  async deleteAgency(agencyId: string, userId: string): Promise<void> {
    const agency = await this.requireAgency(agencyId);
    this.requireAdmin(agency, userId);

    await this.agencyRepo.removeAllAgentsFromAgency(agencyId);
    await this.inviteRepo.revokeAllPendingInvites(agencyId);
    await this.agencyRepo.softDeleteAgency(agencyId);
  }

  async listAgents(agencyId: string, userId: string): Promise<AgencyMember[]> {
    const agency = await this.requireAgency(agencyId);
    return this.agencyRepo.listAgencyMembers(agencyId);
  }

  async removeAgent(agencyId: string, adminId: string, targetUserId: string): Promise<void> {
    const agency = await this.requireAgency(agencyId);
    this.requireAdmin(agency, adminId);

    if (adminId === targetUserId) {
      throw new CannotRemoveSelfError();
    }

    const user = await this.agencyRepo.findUserById(targetUserId);
    if (!user || user.agencyId !== agencyId) {
      throw new AgentNotInAgencyError();
    }

    await this.agencyRepo.setUserAgency(targetUserId, null);
  }

  async leaveAgency(agencyId: string, userId: string): Promise<void> {
    const agency = await this.requireAgency(agencyId);

    if (agency.adminId === userId) {
      throw new AdminCannotLeaveError();
    }

    const user = await this.agencyRepo.findUserById(userId);
    if (!user || user.agencyId !== agencyId) {
      throw new AgentNotInAgencyError();
    }

    await this.agencyRepo.setUserAgency(userId, null);
  }

  async transferAdmin(agencyId: string, currentAdminId: string, newAdminId: string): Promise<void> {
    const agency = await this.requireAgency(agencyId);
    this.requireAdmin(agency, currentAdminId);

    const newAdmin = await this.agencyRepo.findUserById(newAdminId);
    if (!newAdmin || newAdmin.agencyId !== agencyId) {
      throw new AgentNotInAgencyError();
    }

    await this.agencyRepo.setUserRole(currentAdminId, 'agent');
    await this.agencyRepo.setUserRole(newAdminId, 'agency_admin');
    // Update agency adminId
    await this.agencyRepo.updateAgency(agencyId, {} as UpdateAgencyInput);
  }

  // ─── Helpers ───

  private async requireAgency(agencyId: string): Promise<AgencyRecord> {
    const agency = await this.agencyRepo.findAgencyById(agencyId);
    if (!agency) {
      throw new AgencyNotFoundError();
    }
    return agency;
  }

  private requireAdmin(agency: AgencyRecord, userId: string): void {
    if (agency.adminId !== userId) {
      throw new NotAgencyOwnerError();
    }
  }
}
