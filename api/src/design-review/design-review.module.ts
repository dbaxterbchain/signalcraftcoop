import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DesignReviewController } from './design-review.controller';
import { DesignReviewService } from './design-review.service';

@Module({
  imports: [AuthModule],
  controllers: [DesignReviewController],
  providers: [DesignReviewService],
  exports: [DesignReviewService],
})
export class DesignReviewModule {}
