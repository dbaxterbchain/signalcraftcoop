import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateDesignReviewDto } from './dto/create-design-review.dto';
import { DesignReviewStatus, DesignStatus } from './dto/design.enums';

type DesignRecord = {
  id: string;
  orderId: string;
  version: number;
  status: DesignStatus;
  previewUrl: string;
  sourceUrl?: string;
  createdAt: string;
};

type DesignReviewRecord = {
  id: string;
  designId: string;
  status: DesignReviewStatus;
  comment?: string;
  attachmentUrl?: string;
  createdAt: string;
};

const seedDesigns: DesignRecord[] = [
  {
    id: 'design_1',
    orderId: 'order_1',
    version: 1,
    status: DesignStatus.InReview,
    previewUrl: 'https://example.com/designs/preview-1.png',
    createdAt: new Date().toISOString(),
  },
];

const seedReviews: DesignReviewRecord[] = [
  {
    id: 'review_1',
    designId: 'design_1',
    status: DesignReviewStatus.ChangesRequested,
    comment: 'Please reduce logo size by 10%.',
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class DesignReviewService {
  private designs = [...seedDesigns];
  private reviews = [...seedReviews];

  listDesigns(orderId: string) {
    const designs = this.designs.filter((design) => design.orderId === orderId);
    return designs;
  }

  createDesign(orderId: string, payload: CreateDesignDto) {
    const id = `design_${this.designs.length + 1}`;
    const design: DesignRecord = {
      id,
      orderId,
      version: payload.version,
      status: payload.status,
      previewUrl: payload.previewUrl,
      sourceUrl: payload.sourceUrl,
      createdAt: new Date().toISOString(),
    };
    this.designs.unshift(design);
    return design;
  }

  createReview(designId: string, payload: CreateDesignReviewDto) {
    const design = this.designs.find((item) => item.id === designId);
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    const review: DesignReviewRecord = {
      id: `review_${this.reviews.length + 1}`,
      designId,
      status: payload.status,
      comment: payload.comment,
      attachmentUrl: payload.attachmentUrl,
      createdAt: new Date().toISOString(),
    };
    if (payload.status === DesignReviewStatus.Approved) {
      design.status = DesignStatus.Approved;
    }
    if (payload.status === DesignReviewStatus.ChangesRequested) {
      design.status = DesignStatus.ChangesRequested;
    }
    this.reviews.unshift(review);
    return review;
  }
}
