import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, OrderType, PaymentStatus } from './dto/order.enums';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type OrderListFilters = {
  status?: string;
  type?: string;
};

type OrderItemRecord = {
  id: string;
  productId?: string;
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  nfcConfig?: { url: string; kind?: string; notes?: string };
  designId?: string;
};

type OrderRecord = {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItemRecord[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: string;
};

const seedOrders: OrderRecord[] = [
  {
    id: 'order_1',
    orderNumber: 'SC-1001',
    type: OrderType.Custom,
    status: OrderStatus.Review,
    paymentStatus: PaymentStatus.Unpaid,
    items: [
      {
        id: 'item_1',
        title: 'Custom NFC Display Stand',
        quantity: 2,
        unitPrice: 85,
        nfcConfig: { url: 'https://signalcraft.coop/reorder', kind: 'reorder' },
      },
    ],
    subtotal: 170,
    tax: 0,
    shipping: 0,
    total: 170,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order_2',
    orderNumber: 'SC-1002',
    type: OrderType.Store,
    status: OrderStatus.Production,
    paymentStatus: PaymentStatus.Paid,
    items: [
      {
        id: 'item_2',
        productId: 'prod_1',
        title: 'Logo Keychain (NFC)',
        sku: 'KEY-NFC-01',
        quantity: 25,
        unitPrice: 6,
      },
    ],
    subtotal: 150,
    tax: 0,
    shipping: 0,
    total: 150,
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class OrdersService {
  private orders = [...seedOrders];

  listOrders(filters: OrderListFilters) {
    let items = [...this.orders];
    if (filters.status) {
      items = items.filter((order) => order.status === filters.status);
    }
    if (filters.type) {
      items = items.filter((order) => order.type === filters.type);
    }
    return items;
  }

  createOrder(payload: CreateOrderDto) {
    const id = `order_${this.orders.length + 1}`;
    const orderNumber = `SC-${1000 + this.orders.length + 1}`;
    const subtotal = payload.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const order: OrderRecord = {
      id,
      orderNumber,
      type: payload.type,
      status: OrderStatus.Intake,
      paymentStatus: PaymentStatus.Unpaid,
      items: payload.items.map((item, index) => ({
        id: `item_${index + 1}`,
        productId: item.productId,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        nfcConfig: item.nfcConfig,
        designId: item.designId,
      })),
      subtotal,
      tax: 0,
      shipping: 0,
      total: subtotal,
      createdAt: new Date().toISOString(),
    };
    this.orders.unshift(order);
    return order;
  }

  getOrder(orderId: string) {
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  updateStatus(orderId: string, payload: UpdateOrderStatusDto) {
    const order = this.getOrder(orderId);
    order.status = payload.status;
    return order;
  }
}
