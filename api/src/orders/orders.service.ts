import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  OrderStatus as DbOrderStatus,
  OrderType as DbOrderType,
  PaymentStatus as DbPaymentStatus,
} from '@prisma/client';
import { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, OrderType, PaymentStatus } from './dto/order.enums';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderShippingDto } from './dto/update-order-shipping.dto';
import { CreateOrderEventDto } from './dto/create-order-event.dto';
import { AddressDto } from './dto/address.dto';

type OrderListFilters = {
  status?: string;
  type?: string;
};

const orderStatusToDb: Record<OrderStatus, DbOrderStatus> = {
  [OrderStatus.Submitted]: DbOrderStatus.intake,
  [OrderStatus.Designing]: DbOrderStatus.designing,
  [OrderStatus.Review]: DbOrderStatus.review,
  [OrderStatus.Approved]: DbOrderStatus.approved,
  [OrderStatus.Production]: DbOrderStatus.production,
  [OrderStatus.Shipping]: DbOrderStatus.shipping,
  [OrderStatus.Complete]: DbOrderStatus.complete,
  [OrderStatus.OnHold]: DbOrderStatus.on_hold,
  [OrderStatus.Canceled]: DbOrderStatus.canceled,
};

const orderStatusFromDb: Record<DbOrderStatus, OrderStatus> = {
  [DbOrderStatus.intake]: OrderStatus.Submitted,
  [DbOrderStatus.designing]: OrderStatus.Designing,
  [DbOrderStatus.review]: OrderStatus.Review,
  [DbOrderStatus.approved]: OrderStatus.Approved,
  [DbOrderStatus.production]: OrderStatus.Production,
  [DbOrderStatus.shipping]: OrderStatus.Shipping,
  [DbOrderStatus.complete]: OrderStatus.Complete,
  [DbOrderStatus.on_hold]: OrderStatus.OnHold,
  [DbOrderStatus.canceled]: OrderStatus.Canceled,
};

const orderStatusAliases: Record<string, DbOrderStatus> = {
  submitted: DbOrderStatus.intake,
  intake: DbOrderStatus.intake,
  designing: DbOrderStatus.designing,
  review: DbOrderStatus.review,
  approved: DbOrderStatus.approved,
  production: DbOrderStatus.production,
  shipping: DbOrderStatus.shipping,
  complete: DbOrderStatus.complete,
  'on-hold': DbOrderStatus.on_hold,
  on_hold: DbOrderStatus.on_hold,
  canceled: DbOrderStatus.canceled,
};

const orderTypeToDb: Record<OrderType, DbOrderType> = {
  [OrderType.Custom]: DbOrderType.custom,
  [OrderType.Store]: DbOrderType.store,
};

const orderTypeFromDb: Record<DbOrderType, OrderType> = {
  [DbOrderType.custom]: OrderType.Custom,
  [DbOrderType.store]: OrderType.Store,
};

const paymentStatusToDb: Record<PaymentStatus, DbPaymentStatus> = {
  [PaymentStatus.Unpaid]: DbPaymentStatus.unpaid,
  [PaymentStatus.Authorized]: DbPaymentStatus.authorized,
  [PaymentStatus.Paid]: DbPaymentStatus.paid,
  [PaymentStatus.Refunded]: DbPaymentStatus.refunded,
  [PaymentStatus.Disputed]: DbPaymentStatus.disputed,
};

const resolveOrderStatus = (status?: string): DbOrderStatus | undefined => {
  if (!status) {
    return undefined;
  }
  return orderStatusAliases[status];
};

const resolveOrderType = (type?: string): DbOrderType | undefined => {
  if (!type) {
    return undefined;
  }
  const normalized = type.toLowerCase();
  if (normalized === 'custom') {
    return DbOrderType.custom;
  }
  if (normalized === 'store') {
    return DbOrderType.store;
  }
  return undefined;
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: { include: { nfcConfig: true } };
  };
}>;

type OrderWithItemsAndEvents = Prisma.OrderGetPayload<{
  include: {
    items: { include: { nfcConfig: true } };
    events: true;
  };
}>;

type OrderWithOptionalEvents = OrderWithItems & {
  events?: OrderWithItemsAndEvents['events'];
};

type OrderEventRecord = OrderWithItemsAndEvents['events'][number] & {
  isCustomerVisible?: boolean | null;
};

const formatOrder = (order: OrderWithOptionalEvents) => ({
  id: order.id,
  orderNumber: order.orderNumber,
  type: orderTypeFromDb[order.type],
  status: orderStatusFromDb[order.status],
  paymentStatus: order.paymentStatus,
  paymentRequiredAt: order.paymentRequiredAt
    ? order.paymentRequiredAt.toISOString()
    : undefined,
  paidAt: order.paidAt ? order.paidAt.toISOString() : undefined,
  paymentProvider: order.paymentProvider ?? undefined,
  paymentReference: order.paymentReference ?? undefined,
  paymentMethod: order.paymentMethod ?? undefined,
  items: order.items.map((item) => ({
    id: item.id,
    productId: item.productId ?? undefined,
    title: item.title,
    sku: item.sku ?? undefined,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    nfcConfig: item.nfcConfig
      ? {
          url: item.nfcConfig.url,
          kind: item.nfcConfig.kind ?? undefined,
          notes: item.nfcConfig.notes ?? undefined,
        }
      : undefined,
    metadata: item.metadata ?? undefined,
    designId: item.designId ?? undefined,
  })),
  subtotal: order.subtotal,
  tax: order.tax,
  shipping: order.shipping,
  total: order.total,
  shippingAddress: parseAddress(order.shippingAddress),
  billingAddress: parseAddress(order.billingAddress),
  shippingCarrier: order.shippingCarrier ?? undefined,
  shippingService: order.shippingService ?? undefined,
  trackingNumber: order.trackingNumber ?? undefined,
  trackingUrl: order.trackingUrl ?? undefined,
  shippedAt: order.shippedAt ? order.shippedAt.toISOString() : undefined,
  deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : undefined,
  events: order.events?.map((event: OrderEventRecord) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    description: event.description ?? undefined,
    metadata: event.metadata ?? undefined,
    isCustomerVisible: event.isCustomerVisible,
    createdBy: event.createdBy ?? undefined,
    createdAt: event.createdAt.toISOString(),
  })),
  createdAt: order.createdAt.toISOString(),
});

const parseAddress = (
  address?: Prisma.JsonValue | string | null,
): AddressDto | undefined => {
  if (!address) {
    return undefined;
  }
  if (typeof address === 'string') {
    try {
      return JSON.parse(address) as AddressDto;
    } catch {
      return undefined;
    }
  }
  return address as unknown as AddressDto;
};

const serializeAddress = (address?: CreateOrderDto['shippingAddress']) =>
  (address ?? undefined) as Prisma.InputJsonValue | undefined;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private isAdmin(user?: AuthUser) {
    return (user?.groups ?? []).includes('admin');
  }

  private async resolveUserId(user?: AuthUser) {
    if (!user?.email) {
      return null;
    }
    const record = await this.prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.username ?? undefined,
      },
      create: {
        email: user.email,
        name: user.username ?? undefined,
      },
    });
    return record.id;
  }

  async listOrders(filters: OrderListFilters, user?: AuthUser) {
    const where: Prisma.OrderWhereInput = {};
    const status = resolveOrderStatus(filters.status);
    if (status) {
      where.status = status;
    }
    const type = resolveOrderType(filters.type);
    if (type) {
      where.type = type;
    }

    if (!this.isAdmin(user)) {
      const userId = await this.resolveUserId(user);
      if (!userId) {
        return [];
      }
      where.userId = userId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { nfcConfig: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => formatOrder(order));
  }

  async createOrder(payload: CreateOrderDto, user?: AuthUser) {
    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const count = await this.prisma.order.count();
    const orderNumber = `SC-${1000 + count + 1}`;
    const userId = await this.resolveUserId(user);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        type: orderTypeToDb[payload.type],
        status: orderStatusToDb[OrderStatus.Submitted],
        paymentStatus: paymentStatusToDb[PaymentStatus.Unpaid],
        subtotal,
        tax: 0,
        shipping: 0,
        total: subtotal,
        shippingAddress: serializeAddress(payload.shippingAddress),
        billingAddress: serializeAddress(payload.billingAddress),
        user: userId ? { connect: { id: userId } } : undefined,
        items: {
          create: payload.items.map((item) => ({
            title: item.title,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            designId: item.designId,
            product: item.productId
              ? { connect: { id: item.productId } }
              : undefined,
            nfcConfig: item.nfcConfig
              ? {
                  create: {
                    url: item.nfcConfig.url,
                    kind: item.nfcConfig.kind,
                    notes: item.nfcConfig.notes,
                  },
                }
              : undefined,
            metadata: item.metadata as Prisma.InputJsonValue | undefined,
          })),
        },
      },
      include: { items: { include: { nfcConfig: true } } },
    });

    return formatOrder(order);
  }

  async getOrder(orderId: string, user?: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { nfcConfig: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.isAdmin(user)) {
      const userId = await this.resolveUserId(user);
      if (!userId || order.userId !== userId) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    const events = this.isAdmin(user)
      ? order.events
      : order.events.filter((event) => event.isCustomerVisible);

    return formatOrder({ ...order, events });
  }

  async updateStatus(
    orderId: string,
    payload: UpdateOrderStatusDto,
    user?: AuthUser,
  ) {
    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { type: true, paymentStatus: true, paymentRequiredAt: true },
    });
    if (!existing) {
      throw new NotFoundException('Order not found');
    }

    const shouldRequirePayment =
      payload.status === OrderStatus.Approved &&
      existing.type === DbOrderType.custom &&
      existing.paymentStatus === DbPaymentStatus.unpaid &&
      !existing.paymentRequiredAt;

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: orderStatusToDb[payload.status],
        paymentRequiredAt: shouldRequirePayment ? new Date() : undefined,
      },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        type: 'status',
        title: `Status updated to ${payload.status}`,
        createdBy: user?.email ?? user?.username,
        isCustomerVisible: true,
      },
    });

    return this.getOrder(orderId, user);
  }

  async updateShipping(
    orderId: string,
    payload: UpdateOrderShippingDto,
    user?: AuthUser,
  ) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        shippingCarrier: payload.shippingCarrier,
        shippingService: payload.shippingService,
        trackingNumber: payload.trackingNumber,
        trackingUrl: payload.trackingUrl,
        shippedAt: payload.shippedAt ? new Date(payload.shippedAt) : undefined,
        deliveredAt: payload.deliveredAt
          ? new Date(payload.deliveredAt)
          : undefined,
      },
    });

    await this.prisma.orderEvent.create({
      data: {
        orderId,
        type: 'shipping',
        title: 'Shipping updated',
        description: payload.trackingNumber
          ? `Tracking number ${payload.trackingNumber}`
          : undefined,
        createdBy: user?.email ?? user?.username,
        isCustomerVisible: true,
      },
    });

    return this.getOrder(orderId, user);
  }

  async addEvent(
    orderId: string,
    payload: CreateOrderEventDto,
    user?: AuthUser,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.orderEvent.create({
      data: {
        orderId,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        metadata: payload.metadata as Prisma.InputJsonValue | undefined,
        isCustomerVisible: payload.isCustomerVisible ?? true,
        createdBy: user?.email ?? user?.username,
      },
    });
  }

  async updatePaymentStatus(orderId: string, payload: UpdatePaymentStatusDto) {
    const paidAt =
      payload.status === PaymentStatus.Paid ? new Date() : undefined;
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: paymentStatusToDb[payload.status],
        paidAt,
      },
      include: { items: { include: { nfcConfig: true } } },
    });

    return formatOrder(order);
  }
}
