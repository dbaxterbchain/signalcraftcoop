import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  OrderStatus as DbOrderStatus,
  OrderType as DbOrderType,
  PaymentStatus as DbPaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, OrderType, PaymentStatus } from './dto/order.enums';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type OrderListFilters = {
  status?: string;
  type?: string;
};

const orderStatusToDb: Record<OrderStatus, DbOrderStatus> = {
  [OrderStatus.Intake]: DbOrderStatus.intake,
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
  [DbOrderStatus.intake]: OrderStatus.Intake,
  [DbOrderStatus.designing]: OrderStatus.Designing,
  [DbOrderStatus.review]: OrderStatus.Review,
  [DbOrderStatus.approved]: OrderStatus.Approved,
  [DbOrderStatus.production]: OrderStatus.Production,
  [DbOrderStatus.shipping]: OrderStatus.Shipping,
  [DbOrderStatus.complete]: OrderStatus.Complete,
  [DbOrderStatus.on_hold]: OrderStatus.OnHold,
  [DbOrderStatus.canceled]: OrderStatus.Canceled,
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

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(filters: OrderListFilters) {
    const where: Prisma.OrderWhereInput = {};
    if (filters.status) {
      const status = filters.status as OrderStatus;
      where.status = orderStatusToDb[status];
    }
    if (filters.type) {
      const type = filters.type as OrderType;
      where.type = orderTypeToDb[type];
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { nfcConfig: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      type: orderTypeFromDb[order.type],
      status: orderStatusFromDb[order.status],
      paymentStatus: order.paymentStatus,
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
        designId: item.designId ?? undefined,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
    }));
  }

  async createOrder(payload: CreateOrderDto) {
    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const count = await this.prisma.order.count();
    const orderNumber = `SC-${1000 + count + 1}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        type: orderTypeToDb[payload.type],
        status: orderStatusToDb[OrderStatus.Intake],
        paymentStatus: paymentStatusToDb[PaymentStatus.Unpaid],
        subtotal,
        tax: 0,
        shipping: 0,
        total: subtotal,
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
          })),
        },
      },
      include: { items: { include: { nfcConfig: true } } },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: orderTypeFromDb[order.type],
      status: orderStatusFromDb[order.status],
      paymentStatus: order.paymentStatus,
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
        designId: item.designId ?? undefined,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
    };
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { nfcConfig: true } } },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: orderTypeFromDb[order.type],
      status: orderStatusFromDb[order.status],
      paymentStatus: order.paymentStatus,
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
        designId: item.designId ?? undefined,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
    };
  }

  async updateStatus(orderId: string, payload: UpdateOrderStatusDto) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatusToDb[payload.status] },
      include: { items: { include: { nfcConfig: true } } },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: orderTypeFromDb[order.type],
      status: orderStatusFromDb[order.status],
      paymentStatus: order.paymentStatus,
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
        designId: item.designId ?? undefined,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
