-- Create payment methods table and link orders to selected method
CREATE TABLE "PaymentMethod" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phoneNumber" TEXT NOT NULL,
  "transferProofInstruction" TEXT NOT NULL,
  "supportNumber" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "paymentMethodId" TEXT;

INSERT INTO "PaymentMethod" ("id", "name", "phoneNumber", "transferProofInstruction", "isActive", "createdAt", "updatedAt")
VALUES (
  'default-payment-method',
  'فودافون كاش',
  '01000000000',
  'بعد التحويل، أرسل صورة تأكيد العملية على رقم الواتساب الموضح.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

UPDATE "Order" SET "paymentMethodId" = 'default-payment-method' WHERE "paymentMethodId" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "paymentMethodId" SET NOT NULL;

CREATE INDEX "PaymentMethod_isActive_idx" ON "PaymentMethod"("isActive");
CREATE INDEX "PaymentMethod_createdAt_idx" ON "PaymentMethod"("createdAt");
CREATE INDEX "Order_paymentMethodId_idx" ON "Order"("paymentMethodId");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_paymentMethodId_fkey"
FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
