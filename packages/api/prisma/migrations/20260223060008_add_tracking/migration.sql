-- CreateEnum
CREATE TYPE "track_event_type" AS ENUM ('page_opened', 'section_viewed', 'media_viewed', 'time_spent', 'page_closed');

-- CreateTable
CREATE TABLE "track_events" (
    "id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "event_type" "track_event_type" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "track_events_link_id_idx" ON "track_events"("link_id");

-- CreateIndex
CREATE INDEX "track_events_event_type_idx" ON "track_events"("event_type");

-- CreateIndex
CREATE INDEX "track_events_timestamp_idx" ON "track_events"("timestamp");

-- AddForeignKey
ALTER TABLE "track_events" ADD CONSTRAINT "track_events_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "share_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
