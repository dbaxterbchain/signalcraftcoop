import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@UseGuards(CognitoJwtGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders(@Query('status') status?: string, @Query('type') type?: string) {
    return this.ordersService.listOrders({ status, type });
  }

  @Post()
  createOrder(@Body() payload: CreateOrderDto) {
    return this.ordersService.createOrder(payload);
  }

  @Get(':orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrder(orderId);
  }

  @Patch(':orderId/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() payload: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(orderId, payload);
  }

  @Patch(':orderId/payment')
  updatePaymentStatus(
    @Param('orderId') orderId: string,
    @Body() payload: UpdatePaymentStatusDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const allowMockPayments =
      (process.env.ALLOW_MOCK_PAYMENTS ?? '').toLowerCase() === 'true';
    const userGroups = user?.groups ?? [];
    const isAdmin = userGroups.includes('admin');
    if (!allowMockPayments && !isAdmin) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return this.ordersService.updatePaymentStatus(orderId, payload);
  }
}
