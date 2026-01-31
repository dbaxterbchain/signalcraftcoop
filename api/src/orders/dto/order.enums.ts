export enum OrderType {
  Custom = 'custom',
  Store = 'store',
}

export enum OrderStatus {
  Intake = 'intake',
  Designing = 'designing',
  Review = 'review',
  Approved = 'approved',
  Production = 'production',
  Shipping = 'shipping',
  Complete = 'complete',
  OnHold = 'on-hold',
  Canceled = 'canceled',
}

export enum PaymentStatus {
  Unpaid = 'unpaid',
  Authorized = 'authorized',
  Paid = 'paid',
  Refunded = 'refunded',
  Disputed = 'disputed',
}
