import { PrismaClient, MediaType as PrismaMediaType } from '@prisma/client';
import { IMediaRepository, MediaRecord, MediaType } from '../property/property.types';

const mediaTypeToPrisma: Record<MediaType, PrismaMediaType> = {
  photo: 'PHOTO',
  floor_plan: 'FLOOR_PLAN',
  model_3d: 'MODEL_3D',
  video: 'VIDEO',
  document: 'DOCUMENT',
};

const mediaTypeFromPrisma: Record<PrismaMediaType, MediaType> = {
  PHOTO: 'photo',
  FLOOR_PLAN: 'floor_plan',
  MODEL_3D: 'model_3d',
  VIDEO: 'video',
  DOCUMENT: 'document',
};

function toRecord(m: {
  id: string; propertyId: string; type: PrismaMediaType;
  url: string; thumbnailUrl: string | null; mimeType: string;
  sizeBytes: number; width: number | null; height: number | null;
  order: number; caption: string | null; createdAt: Date;
}): MediaRecord {
  return {
    ...m,
    type: mediaTypeFromPrisma[m.type],
  };
}

export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Omit<MediaRecord, 'id' | 'createdAt'>): Promise<MediaRecord> {
    const m = await this.prisma.media.create({
      data: {
        propertyId: data.propertyId,
        type: mediaTypeToPrisma[data.type],
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: data.width,
        height: data.height,
        order: data.order,
        caption: data.caption,
      },
    });
    return toRecord(m);
  }

  async findById(id: string): Promise<MediaRecord | null> {
    const m = await this.prisma.media.findUnique({ where: { id } });
    return m ? toRecord(m) : null;
  }

  async listByProperty(propertyId: string): Promise<MediaRecord[]> {
    const items = await this.prisma.media.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    });
    return items.map(toRecord);
  }

  async updateCaption(id: string, caption: string): Promise<MediaRecord> {
    const m = await this.prisma.media.update({ where: { id }, data: { caption } });
    return toRecord(m);
  }

  async updateOrder(items: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      items.map(({ id, order }) =>
        this.prisma.media.update({ where: { id }, data: { order } }),
      ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.media.delete({ where: { id } });
  }

  async countByPropertyAndType(propertyId: string, type: MediaType): Promise<number> {
    return this.prisma.media.count({
      where: { propertyId, type: mediaTypeToPrisma[type] },
    });
  }

  async totalSizeByProperty(propertyId: string): Promise<number> {
    const result = await this.prisma.media.aggregate({
      where: { propertyId },
      _sum: { sizeBytes: true },
    });
    return result._sum.sizeBytes ?? 0;
  }

  async getMaxOrder(propertyId: string): Promise<number> {
    const result = await this.prisma.media.aggregate({
      where: { propertyId },
      _max: { order: true },
    });
    return result._max.order ?? -1;
  }
}
