-- CreateEnum
CREATE TYPE "property_type" AS ENUM ('apartment', 'house', 'penthouse', 'duplex', 'garden_apartment', 'studio', 'villa', 'cottage', 'land', 'commercial', 'office', 'other');

-- CreateEnum
CREATE TYPE "property_status" AS ENUM ('draft', 'active', 'under_offer', 'sold', 'rented', 'archived');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('photo', 'floor_plan', 'model_3d', 'video', 'document');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "agency_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "property_type" "property_type" NOT NULL,
    "status" "property_status" NOT NULL DEFAULT 'draft',
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "address" TEXT,
    "city" TEXT,
    "neighborhood" TEXT,
    "area_sqm" DECIMAL(8,2),
    "rooms" DECIMAL(3,1),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floor" INTEGER,
    "total_floors" INTEGER,
    "year_built" INTEGER,
    "parking" INTEGER DEFAULT 0,
    "elevator" BOOLEAN,
    "balcony" BOOLEAN,
    "garden" BOOLEAN,
    "air_conditioning" BOOLEAN,
    "furnished" BOOLEAN,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "type" "media_type" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_owner_id_idx" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "properties_agency_id_idx" ON "properties"("agency_id");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_city_idx" ON "properties"("city");

-- CreateIndex
CREATE INDEX "media_property_id_idx" ON "media"("property_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
