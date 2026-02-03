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
  basePrice?: number;
  allowsNfc?: boolean;
  active?: boolean;
};

export type Order = {
  id: string;
  orderNumber?: string;
  type: string;
  status: string;
  paymentStatus?: string;
  items?: OrderItemInput[];
  total?: number;
  createdAt?: string;
};

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

export type DesignReview = {
  id: string;
  designId: string;
  status: 'approved' | 'changes-requested';
  comment?: string;
  attachmentUrl?: string;
  createdAt?: string;
};
