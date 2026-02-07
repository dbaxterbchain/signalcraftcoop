import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDesign,
  createDesignReview,
  createOrder,
  getDesigns,
  getOrder,
  getOrders,
  getProducts,
  updatePaymentStatus,
} from './client';

vi.mock('../auth/auth', () => ({
  getApiToken: () => 'test-token',
}));

describe('api client', () => {
  beforeEach(() => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('adds auth headers and returns json payload', async () => {
    const response = {
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: 'prod_1' }]),
    };
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(response);

    const result = await getProducts();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/products',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer test-token');
    expect(result).toEqual([{ id: 'prod_1' }]);
  });

  it('throws an error with status when response is not ok', async () => {
    const response = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: vi.fn().mockResolvedValue('Unauthorized'),
    };
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(response);

    await expect(getProducts()).rejects.toMatchObject({ status: 401 });
  });

  it('sends json body for createOrder', async () => {
    const response = {
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'order_1', type: 'custom', status: 'intake' }),
    };
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(response);

    const payload = {
      type: 'custom' as const,
      items: [{ title: 'Keychain', quantity: 1, unitPrice: 10 }],
    };

    await createOrder(payload);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/orders',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('fetches order and related resources', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 'order_1', type: 'custom', status: 'intake' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'order_1', type: 'custom', status: 'intake' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 'design_1', orderId: 'order_1', version: 1 }]),
      });

    await getOrders();
    await getOrder('order_1');
    await getDesigns('order_1');

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/orders',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/orders/order_1',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/orders/order_1/designs',
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it('posts design reviews and payment updates', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'design_1', orderId: 'order_1', version: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'review_1', designId: 'design_1', status: 'approved' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'order_1',
          type: 'custom',
          status: 'intake',
          paymentStatus: 'paid',
        }),
      });

    await createDesign('order_1', {
      version: 1,
      status: 'draft',
      previewUrl: 'https://example.com/design.png',
    });
    await createDesignReview('design_1', { status: 'approved', comment: 'Looks good' });
    await updatePaymentStatus('order_1', { status: 'paid' });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/orders/order_1/designs',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/designs/design_1/reviews',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/orders/order_1/payment',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});
