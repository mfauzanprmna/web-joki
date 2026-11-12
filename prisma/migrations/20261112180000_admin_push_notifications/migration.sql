CREATE TABLE "AdminPushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DevicePushDelivery" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "notificationKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevicePushDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminPushSubscription_endpoint_key" ON "AdminPushSubscription"("endpoint");
CREATE UNIQUE INDEX "DevicePushDelivery_subscriptionId_notificationKey_key"
    ON "DevicePushDelivery"("subscriptionId", "notificationKey");
CREATE INDEX "DevicePushDelivery_sentAt_idx" ON "DevicePushDelivery"("sentAt");

ALTER TABLE "DevicePushDelivery"
    ADD CONSTRAINT "DevicePushDelivery_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "AdminPushSubscription"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
