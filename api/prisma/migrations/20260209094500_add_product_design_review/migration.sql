ALTER TABLE "Product" ADD COLUMN "allowsDesignReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "requiresDesignReview" BOOLEAN NOT NULL DEFAULT false;
