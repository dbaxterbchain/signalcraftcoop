import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateDesignDto } from '../design-review/dto/create-design.dto';
import { DesignReviewService } from '../design-review/design-review.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { ProductsService } from '../products/products.service';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { OrdersService } from '../orders/orders.service';

@UseGuards(CognitoJwtGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly designReviewService: DesignReviewService,
  ) {}

  @Get('orders')
  listOrders(@Query('status') status?: string, @Query('type') type?: string) {
    return this.ordersService.listOrders({ status, type });
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(orderId, payload);
  }

  @Get('orders/:orderId/designs')
  listOrderDesigns(@Param('orderId') orderId: string) {
    return this.designReviewService.listDesigns(orderId);
  }

  @Post('orders/:orderId/designs')
  createOrderDesign(
    @Param('orderId') orderId: string,
    @Body() payload: CreateDesignDto,
  ) {
    return this.designReviewService.createDesign(orderId, payload);
  }

  @Get('products')
  listAllProducts() {
    return this.productsService.listAllProducts();
  }

  @Post('products')
  createProduct(@Body() payload: CreateProductDto) {
    return this.productsService.createProduct(payload);
  }

  @Patch('products/:productId')
  updateProduct(
    @Param('productId') productId: string,
    @Body() payload: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(productId, payload);
  }

  @Patch('products/:productId/deactivate')
  deactivateProduct(@Param('productId') productId: string) {
    return this.productsService.deactivateProduct(productId);
  }
}
