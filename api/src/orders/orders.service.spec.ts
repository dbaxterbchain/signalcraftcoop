import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  OrderStatus as DbOrderStatus,
  OrderType as DbOrderType,
  PaymentStatus as DbPaymentStatus,
} from '@prisma/client';
import { OrdersService } from './orders.service';
import { OrderStatus, OrderType, PaymentStatus } from './dto/order.enums';
import type { AuthUser } from '../auth/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersService', () => {
  const createdAt = new Date('2024-01-01T00:00:00.000Z');

  type OrderRecord = {
    id: string;
    orderNumber: string;
    type: DbOrderType;
    status: DbOrderStatus;
    paymentStatus: DbPaymentStatus;
    paymentRequiredAt?: Date | null;
    paidAt?: Date | null;
    paymentProvider?: string | null;
    paymentReference?: string | null;
    paymentMethod?: string | null;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    shippingAddress?: Prisma.JsonValue | string | null;
    billingAddress?: Prisma.JsonValue | string | null;
    shippingCarrier?: string | null;
    shippingService?: string | null;
    trackingNumber?: string | null;
    trackingUrl?: string | null;
    shippedAt?: Date | null;
    deliveredAt?: Date | null;
    userId?: string | null;
    createdAt: Date;
    items: Array<{
      id: string;
      productId: string | null;
      title: string;
      sku: string | null;
      quantity: number;
      unitPrice: number;
      designId: string | null;
      nfcConfig?: {
        url: string;
        kind?: string | null;
        notes?: string | null;
      } | null;
    }>;
    events?: Array<{
      id: string;
      type: string;
      title: string;
      description?: string | null;
      metadata?: Record<string, unknown> | null;
      isCustomerVisible?: boolean | null;
      createdBy?: string | null;
      createdAt: Date;
    }>;
  };

  type OrderDelegateMock = {
    findMany: jest.Mock<Promise<OrderRecord[]>, [Prisma.OrderFindManyArgs]>;
    create: jest.Mock<Promise<OrderRecord>, [Prisma.OrderCreateArgs]>;
    findUnique: jest.Mock<
      Promise<OrderRecord | null>,
      [Prisma.OrderFindUniqueArgs]
    >;
    update: jest.Mock<Promise<OrderRecord>, [Prisma.OrderUpdateArgs]>;
    count: jest.Mock<Promise<number>, [Prisma.OrderCountArgs?]>;
  };

  type OrderEventDelegateMock = {
    create: jest.Mock<Promise<{ id: string }>, [Prisma.OrderEventCreateArgs]>;
  };

  type PrismaMock = {
    order: OrderDelegateMock;
    orderEvent: OrderEventDelegateMock;
    user: {
      upsert: jest.Mock<Promise<{ id: string }>, [Prisma.UserUpsertArgs]>;
    };
  };

  const makeOrder = (overrides: Partial<OrderRecord> = {}): OrderRecord => ({
    id: 'order_1',
    orderNumber: 'SC-1001',
    type: DbOrderType.custom,
    status: DbOrderStatus.intake,
    paymentStatus: DbPaymentStatus.unpaid,
    subtotal: 100,
    tax: 0,
    shipping: 0,
    total: 100,
    createdAt,
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        title: 'Keychain',
        sku: 'KEY-1',
        quantity: 2,
        unitPrice: 50,
        designId: null,
        nfcConfig: {
          url: 'https://signalcraft.coop',
          kind: 'url',
          notes: 'Test',
        },
      },
    ],
    ...overrides,
  });

  const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
    sub: 'user_sub',
    raw: {},
    ...overrides,
  });

  const createService = () => {
    const prisma: PrismaMock = {
      order: {
        findMany: jest.fn<Promise<OrderRecord[]>, [Prisma.OrderFindManyArgs]>(),
        create: jest.fn<Promise<OrderRecord>, [Prisma.OrderCreateArgs]>(),
        findUnique: jest.fn<
          Promise<OrderRecord | null>,
          [Prisma.OrderFindUniqueArgs]
        >(),
        update: jest.fn<Promise<OrderRecord>, [Prisma.OrderUpdateArgs]>(),
        count: jest.fn<Promise<number>, [Prisma.OrderCountArgs?]>(),
      },
      orderEvent: {
        create: jest.fn<
          Promise<{ id: string }>,
          [Prisma.OrderEventCreateArgs]
        >(),
      },
      user: {
        upsert: jest.fn<Promise<{ id: string }>, [Prisma.UserUpsertArgs]>(),
      },
    };
    const service = new OrdersService(prisma as unknown as PrismaService);
    return { prisma, service };
  };

  it('lists orders without filters', async () => {
    const { prisma, service } = createService();
    const order = makeOrder();
    prisma.order.findMany.mockResolvedValue([order]);

    const result = await service.listOrders(
      {},
      makeUser({ groups: ['admin'] }),
    );

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: {},
      include: { items: { include: { nfcConfig: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result[0].type).toBe(OrderType.Custom);
  });

  it('lists orders with filters', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({
      status: DbOrderStatus.review,
      type: DbOrderType.store,
    });
    prisma.order.findMany.mockResolvedValue([order]);

    const result = await service.listOrders(
      {
        status: OrderStatus.Review,
        type: OrderType.Store,
      },
      makeUser({ groups: ['admin'] }),
    );

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { status: DbOrderStatus.review, type: DbOrderType.store },
      include: { items: { include: { nfcConfig: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result[0].status).toBe(OrderStatus.Review);
  });

  it('creates an order with calculated totals', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({
      orderNumber: 'SC-1003',
      subtotal: 50,
      total: 50,
    });
    prisma.order.count.mockResolvedValue(2);
    prisma.order.create.mockResolvedValue(order);

    const payload: CreateOrderDto = {
      type: OrderType.Custom,
      items: [
        {
          title: 'Keychain',
          quantity: 2,
          unitPrice: 20,
          productId: 'prod_1',
          nfcConfig: {
            url: 'https://signalcraft.coop',
            kind: 'url',
            notes: 'Test config',
          },
        },
        { title: 'Sticker', quantity: 1, unitPrice: 10 },
      ],
    };

    const result = await service.createOrder(payload);

    expect(prisma.order.create).toHaveBeenCalledTimes(1);
    const createArgs = prisma.order.create.mock.calls[0][0];
    expect(createArgs.data).toMatchObject({
      orderNumber: 'SC-1003',
      type: DbOrderType.custom,
      status: DbOrderStatus.intake,
      paymentStatus: DbPaymentStatus.unpaid,
      subtotal: 50,
      total: 50,
    });
    expect(result.orderNumber).toBe('SC-1003');
    expect(result.subtotal).toBe(50);
  });

  it('throws when order is missing', async () => {
    const { prisma, service } = createService();
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.getOrder('missing', makeUser({ groups: ['admin'] })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns order details with optional fields mapped', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({
      items: [
        {
          id: 'item_2',
          productId: null,
          title: 'Sticker',
          sku: null,
          quantity: 1,
          unitPrice: 10,
          designId: null,
          nfcConfig: null,
        },
      ],
    });
    prisma.order.findUnique.mockResolvedValue(order);

    const result = await service.getOrder(
      order.id,
      makeUser({ groups: ['admin'] }),
    );

    expect(result.items[0].productId).toBeUndefined();
    expect(result.items[0].sku).toBeUndefined();
    expect(result.items[0].designId).toBeUndefined();
    expect(result.items[0].nfcConfig).toBeUndefined();
  });

  it('updates order status', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({ status: DbOrderStatus.review });
    prisma.order.update.mockResolvedValue(order);
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.orderEvent.create.mockResolvedValue({ id: 'event_1' });

    const result = await service.updateStatus(
      order.id,
      { status: OrderStatus.Review },
      makeUser({ groups: ['admin'] }),
    );

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: { status: DbOrderStatus.review },
    });
    expect(prisma.orderEvent.create).toHaveBeenCalled();
    expect(prisma.order.findUnique).toHaveBeenCalled();
    expect(result.status).toBe(OrderStatus.Review);
  });

  it('updates payment status', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({ paymentStatus: DbPaymentStatus.paid });
    prisma.order.update.mockResolvedValue(order);

    const result = await service.updatePaymentStatus(order.id, {
      status: PaymentStatus.Paid,
    });

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: {
        paymentStatus: DbPaymentStatus.paid,
        paidAt: expect.any(Date) as unknown as Date,
      },
      include: { items: { include: { nfcConfig: true } } },
    });
    expect(result.paymentStatus).toBe(DbPaymentStatus.paid);
  });

  it('returns empty list when unauthenticated', async () => {
    const { prisma, service } = createService();

    const result = await service.listOrders({});

    expect(result).toEqual([]);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('scopes list orders to the current user', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({ userId: 'user_1' });
    prisma.user.upsert.mockResolvedValue({ id: 'user_1' });
    prisma.order.findMany.mockResolvedValue([order]);

    const result = await service.listOrders(
      { status: 'submitted' },
      makeUser({ email: 'user@example.com', groups: [] }),
    );

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      update: { name: undefined },
      create: { email: 'user@example.com', name: undefined },
    });
    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { status: DbOrderStatus.intake, userId: 'user_1' },
      include: { items: { include: { nfcConfig: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result[0].status).toBe(OrderStatus.Submitted);
  });

  it('ignores unknown type filters', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({ status: DbOrderStatus.review });
    prisma.order.findMany.mockResolvedValue([order]);

    await service.listOrders(
      { status: 'review', type: 'unknown' },
      makeUser({ groups: ['admin'] }),
    );

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { status: DbOrderStatus.review },
      include: { items: { include: { nfcConfig: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('rejects access when user does not own the order', async () => {
    const { prisma, service } = createService();
    const order = makeOrder({ userId: 'owner_1' });
    prisma.user.upsert.mockResolvedValue({ id: 'user_1' });
    prisma.order.findUnique.mockResolvedValue(order);

    await expect(
      service.getOrder(
        order.id,
        makeUser({ email: 'user@example.com', groups: [] }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('updates shipping details and logs an event', async () => {
    const { prisma, service } = createService();
    const order = makeOrder();
    prisma.order.update.mockResolvedValue(order);
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.orderEvent.create.mockResolvedValue({ id: 'event_2' });

    await service.updateShipping(
      order.id,
      {
        shippingCarrier: 'USPS',
        shippingService: 'Priority',
        trackingNumber: 'TRACK123',
        trackingUrl: 'https://tracking.example',
        shippedAt: '2024-01-02T00:00:00.000Z',
      },
      makeUser({ groups: ['admin'] }),
    );

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: {
        shippingCarrier: 'USPS',
        shippingService: 'Priority',
        trackingNumber: 'TRACK123',
        trackingUrl: 'https://tracking.example',
        shippedAt: new Date('2024-01-02T00:00:00.000Z'),
        deliveredAt: undefined,
      },
    });
    expect(prisma.orderEvent.create).toHaveBeenCalledWith({
      data: {
        orderId: order.id,
        type: 'shipping',
        title: 'Shipping updated',
        description: 'Tracking number TRACK123',
        createdBy: undefined,
        isCustomerVisible: true,
      },
    });
  });

  it('creates an order event for existing orders', async () => {
    const { prisma, service } = createService();
    const order = makeOrder();
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.orderEvent.create.mockResolvedValue({ id: 'event_3' });

    const result = await service.addEvent(
      order.id,
      { type: 'note', title: 'Manual note', description: 'Added by admin' },
      makeUser({ email: 'admin@example.com', groups: ['admin'] }),
    );

    expect(prisma.orderEvent.create).toHaveBeenCalledWith({
      data: {
        orderId: order.id,
        type: 'note',
        title: 'Manual note',
        description: 'Added by admin',
        metadata: undefined,
        isCustomerVisible: true,
        createdBy: 'admin@example.com',
      },
    });
    expect(result).toEqual({ id: 'event_3' });
  });
});
