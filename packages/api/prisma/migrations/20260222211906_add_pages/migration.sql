-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "branding_id" TEXT,
    "title" TEXT,
    "selected_elements" JSONB NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'standard',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pages_property_id_idx" ON "pages"("property_id");

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
