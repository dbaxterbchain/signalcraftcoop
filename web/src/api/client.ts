import type {
  CreateDesignReviewPayload,
  CreateOrderPayload,
  Design,
  DesignReview,
  Order,
  Product,
} from './types';

const baseUrl = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000';
const envToken = import.meta.env.VITE_API_TOKEN as string | undefined;

function getAuthToken() {
  return envToken || undefined;
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
    credentials: 'include',
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

export function getDesigns(orderId: string): Promise<Design[]> {
  return request<Design[]>(`/orders/${orderId}/designs`);
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
