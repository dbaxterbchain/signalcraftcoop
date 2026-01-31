import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DesignReviewService } from './design-review.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateDesignReviewDto } from './dto/create-design-review.dto';

@UseGuards(CognitoJwtGuard)
@Controller()
export class DesignReviewController {
  constructor(private readonly designReviewService: DesignReviewService) {}

  @Get('orders/:orderId/designs')
  listDesigns(@Param('orderId') orderId: string) {
    return this.designReviewService.listDesigns(orderId);
  }

  @Post('orders/:orderId/designs')
  @UseGuards(RolesGuard)
  @Roles('admin')
  createDesign(
    @Param('orderId') orderId: string,
    @Body() payload: CreateDesignDto,
  ) {
    return this.designReviewService.createDesign(orderId, payload);
  }

  @Post('designs/:designId/reviews')
  createReview(
    @Param('designId') designId: string,
    @Body() payload: CreateDesignReviewDto,
  ) {
    return this.designReviewService.createReview(designId, payload);
  }
}
