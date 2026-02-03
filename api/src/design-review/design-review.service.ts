import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DesignReviewStatus as DbDesignReviewStatus,
  DesignStatus as DbDesignStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateDesignReviewDto } from './dto/create-design-review.dto';
import { DesignReviewStatus, DesignStatus } from './dto/design.enums';

const designStatusToDb: Record<DesignStatus, DbDesignStatus> = {
  [DesignStatus.Draft]: DbDesignStatus.draft,
  [DesignStatus.InReview]: DbDesignStatus.in_review,
  [DesignStatus.ChangesRequested]: DbDesignStatus.changes_requested,
  [DesignStatus.Approved]: DbDesignStatus.approved,
};

const designStatusFromDb: Record<DbDesignStatus, DesignStatus> = {
  [DbDesignStatus.draft]: DesignStatus.Draft,
  [DbDesignStatus.in_review]: DesignStatus.InReview,
  [DbDesignStatus.changes_requested]: DesignStatus.ChangesRequested,
  [DbDesignStatus.approved]: DesignStatus.Approved,
};

const reviewStatusToDb: Record<DesignReviewStatus, DbDesignReviewStatus> = {
  [DesignReviewStatus.Approved]: DbDesignReviewStatus.approved,
  [DesignReviewStatus.ChangesRequested]: DbDesignReviewStatus.changes_requested,
};

const reviewStatusFromDb: Record<DbDesignReviewStatus, DesignReviewStatus> = {
  [DbDesignReviewStatus.approved]: DesignReviewStatus.Approved,
  [DbDesignReviewStatus.changes_requested]: DesignReviewStatus.ChangesRequested,
};

@Injectable()
export class DesignReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async listDesigns(orderId: string) {
    const designs = await this.prisma.design.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return designs.map((design) => ({
      id: design.id,
      orderId: design.orderId,
      version: design.version,
      status: designStatusFromDb[design.status],
      previewUrl: design.previewUrl,
      sourceUrl: design.sourceUrl ?? undefined,
      createdAt: design.createdAt.toISOString(),
    }));
  }

  async createDesign(orderId: string, payload: CreateDesignDto) {
    const design = await this.prisma.design.create({
      data: {
        orderId,
        version: payload.version,
        status: designStatusToDb[payload.status],
        previewUrl: payload.previewUrl,
        sourceUrl: payload.sourceUrl,
      },
    });

    return {
      id: design.id,
      orderId: design.orderId,
      version: design.version,
      status: designStatusFromDb[design.status],
      previewUrl: design.previewUrl,
      sourceUrl: design.sourceUrl ?? undefined,
      createdAt: design.createdAt.toISOString(),
    };
  }

  async createReview(designId: string, payload: CreateDesignReviewDto) {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
    });
    if (!design) {
      throw new NotFoundException('Design not found');
    }

    const nextStatus =
      payload.status === DesignReviewStatus.Approved
        ? designStatusToDb[DesignStatus.Approved]
        : designStatusToDb[DesignStatus.ChangesRequested];

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.designReview.create({
        data: {
          designId,
          status: reviewStatusToDb[payload.status],
          comment: payload.comment,
          attachmentUrl: payload.attachmentUrl,
        },
      });

      await tx.design.update({
        where: { id: designId },
        data: { status: nextStatus },
      });

      return created;
    });

    return {
      id: review.id,
      designId: review.designId,
      status: reviewStatusFromDb[review.status],
      comment: review.comment ?? undefined,
      attachmentUrl: review.attachmentUrl ?? undefined,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
