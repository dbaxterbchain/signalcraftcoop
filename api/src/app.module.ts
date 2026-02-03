import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { DesignReviewModule } from './design-review/design-review.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'api', '.env'),
        path.resolve(__dirname, '..', '.env'),
      ],
    }),
    PrismaModule,
    AdminModule,
    AuthModule,
    OrdersModule,
    ProductsModule,
    DesignReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
