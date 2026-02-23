-- CreateEnum
CREATE TYPE "partner_invite_status" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "reshare_request_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "partner_invites" (
    "id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "invitee_id" TEXT,
    "code" TEXT NOT NULL,
    "status" "partner_invite_status" NOT NULL DEFAULT 'pending',
    "permissions" JSONB NOT NULL DEFAULT '{"canView": true, "canReshare": false}',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reshare_requests" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "status" "reshare_request_status" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,

    CONSTRAINT "reshare_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_invites_code_key" ON "partner_invites"("code");

-- CreateIndex
CREATE INDEX "partner_invites_code_idx" ON "partner_invites"("code");

-- CreateIndex
CREATE INDEX "partner_invites_inviter_id_idx" ON "partner_invites"("inviter_id");

-- CreateIndex
CREATE INDEX "partner_invites_invitee_id_idx" ON "partner_invites"("invitee_id");

-- CreateIndex
CREATE INDEX "reshare_requests_property_id_idx" ON "reshare_requests"("property_id");

-- CreateIndex
CREATE INDEX "reshare_requests_status_idx" ON "reshare_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reshare_requests_partner_id_property_id_key" ON "reshare_requests"("partner_id", "property_id");

-- AddForeignKey
ALTER TABLE "partner_invites" ADD CONSTRAINT "partner_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_invites" ADD CONSTRAINT "partner_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reshare_requests" ADD CONSTRAINT "reshare_requests_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reshare_requests" ADD CONSTRAINT "reshare_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reshare_requests" ADD CONSTRAINT "reshare_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
