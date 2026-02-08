# Data Model (Draft)

This model supports custom orders and store orders in the same workflow.

## Core entities

### User
- id (uuid)
- email (unique)
- name
- phone
- role (customer | admin)
- created_at, updated_at

### Order
- id (uuid)
- user_id (User)
- order_number (human readable)
- type (custom | store)
- status (submitted | designing | review | approved | production | shipping | complete | on-hold | canceled)
- subtotal, tax, shipping, total
- payment_status (unpaid | authorized | paid | refunded | disputed)
- shipping_address_id, billing_address_id
- shipping_carrier, shipping_service, tracking_number, tracking_url
- shipped_at, delivered_at
- created_at, updated_at

### OrderItem
- id (uuid)
- order_id (Order)
- product_id (Product, nullable for custom items)
- title (snapshot)
- sku (snapshot)
- quantity
- unit_price
- nfc_config_id (NFCConfig, nullable)
- design_id (Design, nullable, for custom items)

### Product
- id (uuid)
- title
- sku
- description
- base_price
- category
- allows_nfc (bool)
- active (bool)

### Design
- id (uuid)
- order_id (Order)
- version (int)
- status (draft | in-review | changes-requested | approved)
- preview_url (S3)
- source_url (S3, optional)
- created_by (User or admin)
- created_at

### DesignReview
- id (uuid)
- design_id (Design)
- author_id (User)
- status (approved | changes-requested)
- comment
- attachment_url (S3, optional)
- created_at

### NFCConfig
- id (uuid)
- url
- kind (link | vcard | menu | reorder | other)
- notes
- created_at

### Address
- id (uuid)
- user_id (User)
- label (shipping | billing | other)
- line1, line2, city, state, postal_code, country
- created_at

## Relationships
- User 1..* Order
- Order 1..* OrderItem
- Order 1..* Design
- Order 1..* OrderEvent
- Design 1..* DesignReview
- OrderItem 0..1 Product
- OrderItem 0..1 NFCConfig
- User 0..* Address

### OrderEvent
- id (uuid)
- order_id (Order)
- status (optional)
- message
- created_by (User or admin)
- created_at

### ContactMessage
- id (uuid)
- name, email
- message
- status (new | in-progress | resolved | archived)
- created_at, updated_at

## Notes
- OrderItem snapshots store title and sku so historical orders stay accurate if Product changes.
- DB still stores the initial status as `intake`; API/UI should use `submitted`.
- Multiple Design versions can exist for a single Order. Only one should be marked approved.
- DesignReview represents a single customer response to a design version.
- Prisma schema draft lives at `api/prisma/schema.prisma`.
