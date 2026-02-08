export type Address = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type NfcConfig = {
  url: string;
  kind?: string;
  notes?: string;
};

export type OrderItemInput = {
  productId?: string;
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  nfcConfig?: NfcConfig;
  metadata?: Record<string, unknown>;
  designId?: string;
};

export type CreateOrderPayload = {
  type: 'custom' | 'store';
  items: OrderItemInput[];
  shippingAddress?: Address;
  billingAddress?: Address;
};

export type Product = {
  id: string;
  title: string;
  sku?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  allowsNfc?: boolean;
  allowsLogoUpload?: boolean;
  active?: boolean;
  images?: ProductImage[];
};

export type Order = {
  id: string;
  orderNumber?: string;
  type: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentRequiredAt?: string;
  paidAt?: string;
  paymentProvider?: string;
  paymentReference?: string;
  paymentMethod?: string;
  items?: OrderItemInput[];
  total?: number;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingCarrier?: string;
  shippingService?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
  events?: OrderEvent[];
  createdAt?: string;
};

export type OrderStatus =
  | 'submitted'
  | 'designing'
  | 'review'
  | 'approved'
  | 'production'
  | 'shipping'
  | 'complete'
  | 'on-hold'
  | 'canceled';

export type PaymentStatus = 'unpaid' | 'authorized' | 'paid' | 'refunded' | 'disputed';

export type DesignStatus = 'draft' | 'in-review' | 'changes-requested' | 'approved';

export type Design = {
  id: string;
  orderId: string;
  version: number;
  status: string;
  previewUrl: string;
  sourceUrl?: string;
  createdAt?: string;
};

export type CreateDesignReviewPayload = {
  status: 'approved' | 'changes-requested';
  comment?: string;
  attachmentUrl?: string;
};

export type CreateDesignPayload = {
  version: number;
  status: DesignStatus;
  previewUrl: string;
  sourceUrl?: string;
};

export type UpdatePaymentStatusPayload = {
  status: PaymentStatus;
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
};

export type UpdateOrderShippingPayload = {
  shippingCarrier?: string;
  shippingService?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  deliveredAt?: string;
};

export type CreateOrderEventPayload = {
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isCustomerVisible?: boolean;
};

export type DesignReview = {
  id: string;
  designId: string;
  status: 'approved' | 'changes-requested';
  comment?: string;
  attachmentUrl?: string;
  createdAt?: string;
};

export type ProductImage = {
  id?: string;
  url: string;
  isMain?: boolean;
  sortOrder?: number;
  altText?: string;
};

export type UploadCategory = 'preview' | 'source' | 'review' | 'product' | 'logo';

export type CreateUploadUrlPayload = {
  fileName: string;
  contentType: string;
  category: UploadCategory;
  orderId?: string;
};

export type UploadUrlResponse = {
  uploadUrl: string;
  fileUrl: string;
  key: string;
};

export type OrderEvent = {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isCustomerVisible?: boolean;
  createdBy?: string;
  createdAt?: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'open' | 'closed';
  createdAt?: string;
  updatedAt?: string;
};

export type CreateContactMessagePayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export type UpdateContactMessagePayload = {
  status: 'open' | 'closed';
};
