-- Add payment tracking fields
ALTER TABLE "Order" ADD COLUMN "paymentRequiredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "paymentProvider" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentReference" TEXT;
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;

-- Convert address fields to JSONB (safe cast)
ALTER TABLE "Order" ALTER COLUMN "shippingAddress" TYPE JSONB
USING CASE
  WHEN "shippingAddress" IS NULL OR "shippingAddress" = '' THEN NULL
  ELSE "shippingAddress"::jsonb
END;

ALTER TABLE "Order" ALTER COLUMN "billingAddress" TYPE JSONB
USING CASE
  WHEN "billingAddress" IS NULL OR "billingAddress" = '' THEN NULL
  ELSE "billingAddress"::jsonb
END;

-- Order event visibility
ALTER TABLE "OrderEvent" ADD COLUMN "isCustomerVisible" BOOLEAN NOT NULL DEFAULT true;
