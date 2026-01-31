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
import { CognitoJwtGuard } from '../auth/guards/cognito-jwt.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
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
}
