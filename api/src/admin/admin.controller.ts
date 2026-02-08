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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { CreateDesignDto } from '../design-review/dto/create-design.dto';
import { DesignReviewService } from '../design-review/design-review.service';
import { CreateProductDto } from '../products/dto/create-product.dto';
import { UpdateProductDto } from '../products/dto/update-product.dto';
import { ProductsService } from '../products/products.service';
import { UpdateOrderStatusDto } from '../orders/dto/update-order-status.dto';
import { OrdersService } from '../orders/orders.service';
import { CreateUploadUrlDto } from '../uploads/dto/create-upload-url.dto';
import { UploadsService } from '../uploads/uploads.service';
import { UpdateOrderShippingDto } from '../orders/dto/update-order-shipping.dto';
import { CreateOrderEventDto } from '../orders/dto/create-order-event.dto';
import { ContactService } from '../contact/contact.service';
import { UpdateContactMessageDto } from '../contact/dto/update-contact-message.dto';

@UseGuards(CognitoJwtGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly designReviewService: DesignReviewService,
    private readonly uploadsService: UploadsService,
    private readonly contactService: ContactService,
  ) {}

  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.ordersService.listOrders({ status, type }, user);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderStatusDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.ordersService.updateStatus(orderId, payload, user);
  }

  @Patch('orders/:orderId/shipping')
  updateOrderShipping(
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderShippingDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.ordersService.updateShipping(orderId, payload, user);
  }

  @Post('orders/:orderId/events')
  createOrderEvent(
    @Param('orderId') orderId: string,
    @Body() payload: CreateOrderEventDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.ordersService.addEvent(orderId, payload, user);
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

  @Post('uploads/presign')
  createUploadUrl(@Body() payload: CreateUploadUrlDto) {
    return this.uploadsService.createPresignedUrl(payload);
  }

  @Get('messages')
  listMessages() {
    return this.contactService.listMessages();
  }

  @Patch('messages/:messageId')
  updateMessage(
    @Param('messageId') messageId: string,
    @Body() payload: UpdateContactMessageDto,
  ) {
    return this.contactService.updateMessage(messageId, payload);
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
