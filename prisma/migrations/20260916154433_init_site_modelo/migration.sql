-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "description" TEXT,
    "segment" TEXT,
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "business_hours" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "consent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assigned_to" TEXT,
    "public_response" TEXT,
    "archived_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_events" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "event_type" TEXT NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "company_user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_users_email_key" ON "company_users"("email");

-- CreateIndex
CREATE INDEX "company_users_company_id_idx" ON "company_users"("company_id");

-- CreateIndex
CREATE INDEX "categories_company_id_idx" ON "categories"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_company_id_name_key" ON "categories"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_protocol_key" ON "submissions"("protocol");

-- CreateIndex
CREATE INDEX "submissions_company_id_status_idx" ON "submissions"("company_id", "status");

-- CreateIndex
CREATE INDEX "submissions_company_id_created_at_idx" ON "submissions"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "submission_events_submission_id_created_at_idx" ON "submission_events"("submission_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_hash_key" ON "password_resets"("token_hash");

-- CreateIndex
CREATE INDEX "password_resets_company_user_id_idx" ON "password_resets"("company_user_id");

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "company_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_events" ADD CONSTRAINT "submission_events_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_events" ADD CONSTRAINT "submission_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "company_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_company_user_id_fkey" FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
