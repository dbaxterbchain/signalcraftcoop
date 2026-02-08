-- Add metadata for order items
ALTER TABLE "OrderItem" ADD COLUMN "metadata" JSONB;

-- Flag for products that accept logo uploads
ALTER TABLE "Product" ADD COLUMN "allowsLogoUpload" BOOLEAN NOT NULL DEFAULT false;
