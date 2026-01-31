import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DesignReviewModule } from '../design-review/design-review.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [AuthModule, OrdersModule, ProductsModule, DesignReviewModule],
  controllers: [AdminController],
})
export class AdminModule {}
