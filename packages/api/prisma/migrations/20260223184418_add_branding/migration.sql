-- CreateTable
CREATE TABLE "branding_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "agency_id" TEXT,
    "is_agency_default" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" TEXT,
    "photo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#1A1A2E',
    "secondary_color" TEXT NOT NULL DEFAULT '#16213E',
    "accent_color" TEXT NOT NULL DEFAULT '#0F3460',
    "text_color" TEXT NOT NULL DEFAULT '#FFFFFF',
    "font_family" TEXT NOT NULL DEFAULT 'Assistant',
    "display_name" TEXT,
    "tagline" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "contact_website" TEXT,
    "contact_whatsapp" TEXT,
    "social_facebook" TEXT,
    "social_instagram" TEXT,
    "social_linkedin" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'he',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branding_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branding_profiles_user_id_key" ON "branding_profiles"("user_id");

-- CreateIndex
CREATE INDEX "branding_profiles_agency_id_is_agency_default_idx" ON "branding_profiles"("agency_id", "is_agency_default");

-- AddForeignKey
ALTER TABLE "branding_profiles" ADD CONSTRAINT "branding_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branding_profiles" ADD CONSTRAINT "branding_profiles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
