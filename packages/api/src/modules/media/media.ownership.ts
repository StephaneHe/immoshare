import { PrismaClient } from '@prisma/client';
import { IPropertyOwnershipChecker } from './media.service';

/**
 * Checks property ownership using direct Prisma access.
 * A property is "owned" by userId if:
 *   - The user is the direct ownerId, OR
 *   - The user belongs to the agency that owns the property.
 */
export class PrismaPropertyOwnershipChecker implements IPropertyOwnershipChecker {
  constructor(private readonly prisma: PrismaClient) {}

  async isOwner(propertyId: string, userId: string): Promise<boolean> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { ownerId: true, agencyId: true },
    });

    if (!property) return false;
    if (property.ownerId === userId) return true;

    // Check if user belongs to the same agency
    if (property.agencyId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { agencyId: true },
      });
      if (user?.agencyId === property.agencyId) return true;
    }

    return false;
  }
}
