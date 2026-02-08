# Order Workflow

Order types
- custom: customer provides requirements, design review loop required
- store: standard product purchase, optional NFC configuration

Customer Orders page (Account)
- Shows only the signed-in customer’s orders (custom + store).
- Customer actions only: approve/reject designs, pay (when required), view updates, reorder.
- No admin controls appear here.

Status model
- submitted: order received, requirements captured
- designing: design work in progress
- review: customer review required
- approved: design approved, ready for production
- production: items being produced
- shipping: in transit or preparing shipment
- complete: delivered or closed
- on-hold: waiting for customer info or payment
- canceled: order closed without fulfillment

Custom order flow
1) submitted -> designing
2) designing -> review
3) review -> approved (or back to designing if changes requested)
4) approved -> payment required -> production -> shipping -> complete

Payment timing
- Custom orders: payment happens after customer approval and before production.
- Standard products: payment happens during checkout.
- Payment state is tracked separately from status (e.g., pending/paid/failed), and
  production cannot begin until payment is confirmed.

Store order flow
1) add to cart -> checkout (address + payment) -> submitted
2) submitted -> production -> shipping -> complete
- NFC option can be configured at submission and stored in NFCConfig.

Note
- The database still stores the initial status as `intake` for backwards compatibility,
  but the API and UI should use `submitted`.

Reorder flow
- Customer selects a previous order and starts a new order with prefilled data.
- For custom orders, the latest approved design is reused.

Shipping address timing
- Custom orders: collect at payment step (post-approval), allow edits until production.
- Standard orders: collect at checkout.

Admin order management
- Separate Admin Orders page shows all orders with filtering and sorting.
- Admin can open any order to manage the full lifecycle and customer updates.
- Custom orders: review requirements, upload/replace designs, request revisions,
  move status, and manage customer-visible updates.
- Standard orders: review customer inputs, update status, and add shipping info.
- Admin can impersonate a customer order view for troubleshooting.
