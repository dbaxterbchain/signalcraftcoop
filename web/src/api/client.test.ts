import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDesign,
  createDesignReview,
  createOrderEvent,
  createUploadUrl,
  createCustomerUploadUrl,
  createOrder,
  createProduct,
  deactivateProduct,
  getAdminOrders,
  getAdminProducts,
  getContactMessages,
  getDesigns,
  getOrder,
  getOrders,
  getProducts,
  submitContactMessage,
  updateContactMessage,
  updateOrderStatus,
  updateOrderShipping,
  updateProduct,
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
      json: vi.fn().mockResolvedValue({ id: 'order_1', type: 'custom', status: 'submitted' }),
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
        json: vi.fn().mockResolvedValue([{ id: 'order_1', type: 'custom', status: 'submitted' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'order_1', type: 'custom', status: 'submitted' }),
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
          status: 'submitted',
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

  it('posts admin upload presign and order status updates', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          uploadUrl: 'https://uploads.example.com',
          fileUrl: 'https://uploads.example.com/file.png',
          key: 'designs/order/file.png',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'order_1',
          type: 'custom',
          status: 'review',
        }),
      });

    await createUploadUrl({
      fileName: 'file.png',
      contentType: 'image/png',
      category: 'preview',
      orderId: 'order_1',
    });
    await updateOrderStatus('order_1', { status: 'review' });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/admin/uploads/presign',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/admin/orders/order_1/status',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('calls admin, customer, and contact endpoints', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const ok = (data: unknown) => ({
      ok: true,
      json: vi.fn().mockResolvedValue(data),
    });

    fetchMock
      .mockResolvedValueOnce(ok([{ id: 'order_1' }]))
      .mockResolvedValueOnce(ok({ id: 'order_1' }))
      .mockResolvedValueOnce(ok({ id: 'event_1' }))
      .mockResolvedValueOnce(ok([{ id: 'prod_1' }]))
      .mockResolvedValueOnce(ok({ id: 'prod_1' }))
      .mockResolvedValueOnce(ok({ id: 'prod_1' }))
      .mockResolvedValueOnce(ok({ id: 'prod_1' }))
      .mockResolvedValueOnce(ok([{ id: 'msg_1' }]))
      .mockResolvedValueOnce(ok({ id: 'msg_1' }))
      .mockResolvedValueOnce(ok({ id: 'msg_2' }))
      .mockResolvedValueOnce(
        ok({
          uploadUrl: 'https://uploads.example.com',
          fileUrl: 'https://uploads.example.com/logo.png',
          key: 'logos/logo.png',
        }),
      );

    await getAdminOrders();
    await updateOrderShipping('order_1', { trackingNumber: 'TRACK' });
    await createOrderEvent('order_1', { type: 'note', title: 'Note' });
    await getAdminProducts();
    await createProduct({ title: 'Keychain', sku: 'KEY-1', basePrice: 10 });
    await updateProduct('prod_1', { title: 'Updated' });
    await deactivateProduct('prod_1');
    await getContactMessages();
    await updateContactMessage('msg_1', { status: 'closed' });
    await submitContactMessage({
      name: 'Jamie',
      email: 'jamie@example.com',
      message: 'Hello',
    });
    await createCustomerUploadUrl({
      fileName: 'logo.png',
      contentType: 'image/png',
      category: 'logo',
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/admin/orders',
      expect.any(Object),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/admin/orders/order_1/shipping',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/admin/orders/order_1/events',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      11,
      'http://localhost:3000/uploads/presign',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
