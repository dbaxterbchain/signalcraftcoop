# Order Workflow

Order types
- custom: customer provides requirements, design review loop required
- store: standard product purchase, optional NFC configuration

Unified Orders page
- Shows all orders (custom and store) with status, items, and actions.
- Each order links to a detail page with a status timeline.

Status model
- intake: order received, requirements captured
- designing: design work in progress
- review: customer review required
- approved: design approved, ready for production
- production: items being produced
- shipping: in transit or preparing shipment
- complete: delivered or closed
- on-hold: waiting for customer info or payment
- canceled: order closed without fulfillment

Custom order flow
1) intake -> designing
2) designing -> review
3) review -> approved (or back to designing if changes requested)
4) approved -> production -> shipping -> complete

Store order flow
1) intake -> production -> shipping -> complete
- NFC option can be configured at intake and stored in NFCConfig.

Reorder flow
- Customer selects a previous order and starts a new order with prefilled data.
- For custom orders, the latest approved design is reused.