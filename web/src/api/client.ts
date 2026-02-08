import {
  getApiToken,
} from '../auth/auth';
import type {
  ContactMessage,
  CreateContactMessagePayload,
  CreateUploadUrlPayload,
  CreateOrderEventPayload,
  CreateDesignPayload,
  CreateDesignReviewPayload,
  CreateOrderPayload,
  Design,
  DesignReview,
  Order,
  OrderEvent,
  Product,
  UpdateContactMessagePayload,
  UpdateOrderStatusPayload,
  UpdateOrderShippingPayload,
  UpdatePaymentStatusPayload,
  UploadUrlResponse,
} from './types';

const baseUrl = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000';
const envToken = import.meta.env.VITE_API_TOKEN as string | undefined;

function getAuthToken() {
  return envToken || getApiToken() || undefined;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers({
    Accept: 'application/json',
  });
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.headers) {
    const extra = new Headers(options.headers);
    extra.forEach((value, key) => headers.set(key, value));
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || response.statusText);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return (await response.json()) as T;
}

export function getProducts(): Promise<Product[]> {
  return request<Product[]>('/products');
}

export function getProduct(productId: string): Promise<Product> {
  return request<Product>(`/products/${productId}`);
}

export function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getOrders(): Promise<Order[]> {
  return request<Order[]>('/orders');
}

export function getOrder(orderId: string): Promise<Order> {
  return request<Order>(`/orders/${orderId}`);
}

export function getAdminOrders(): Promise<Order[]> {
  return request<Order[]>('/admin/orders');
}

export function getDesigns(orderId: string): Promise<Design[]> {
  return request<Design[]>(`/orders/${orderId}/designs`);
}

export function createDesign(orderId: string, payload: CreateDesignPayload): Promise<Design> {
  return request<Design>(`/orders/${orderId}/designs`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createDesignReview(
  designId: string,
  payload: CreateDesignReviewPayload,
): Promise<DesignReview> {
  return request<DesignReview>(`/designs/${designId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createUploadUrl(payload: CreateUploadUrlPayload): Promise<UploadUrlResponse> {
  return request<UploadUrlResponse>('/admin/uploads/presign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createCustomerUploadUrl(
  payload: CreateUploadUrlPayload,
): Promise<UploadUrlResponse> {
  return request<UploadUrlResponse>('/uploads/presign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateOrderStatus(
  orderId: string,
  payload: UpdateOrderStatusPayload,
): Promise<Order> {
  return request<Order>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateOrderShipping(
  orderId: string,
  payload: UpdateOrderShippingPayload,
): Promise<Order> {
  return request<Order>(`/admin/orders/${orderId}/shipping`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function createOrderEvent(
  orderId: string,
  payload: CreateOrderEventPayload,
): Promise<OrderEvent> {
  return request<OrderEvent>(`/admin/orders/${orderId}/events`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAdminProducts(): Promise<Product[]> {
  return request<Product[]>('/admin/products');
}

export function createProduct(payload: Partial<Product>): Promise<Product> {
  return request<Product>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProduct(
  productId: string,
  payload: Partial<Product>,
): Promise<Product> {
  return request<Product>(`/admin/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deactivateProduct(productId: string): Promise<Product> {
  return request<Product>(`/admin/products/${productId}/deactivate`, {
    method: 'PATCH',
  });
}

export function getContactMessages(): Promise<ContactMessage[]> {
  return request<ContactMessage[]>('/admin/messages');
}

export function updateContactMessage(
  messageId: string,
  payload: UpdateContactMessagePayload,
): Promise<ContactMessage> {
  return request<ContactMessage>(`/admin/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function submitContactMessage(
  payload: CreateContactMessagePayload,
): Promise<ContactMessage> {
  return request<ContactMessage>('/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePaymentStatus(
  orderId: string,
  payload: UpdatePaymentStatusPayload,
): Promise<Order> {
  return request<Order>(`/orders/${orderId}/payment`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
