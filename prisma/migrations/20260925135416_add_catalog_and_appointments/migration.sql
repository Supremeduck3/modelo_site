-- CreateTable
CREATE TABLE "service_offerings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "price_cents" INTEGER,
    "price_from" BOOLEAN NOT NULL DEFAULT false,
    "duration_minutes" INTEGER,
    "bookable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "service_id" TEXT,
    "service_name" TEXT NOT NULL,
    "professional" TEXT,
    "requested_date" DATE NOT NULL,
    "requested_period" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "notes" TEXT,
    "consent_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_date" DATE,
    "scheduled_time" TEXT,
    "response_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_events" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "event_type" TEXT NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_offerings_company_id_is_active_sort_order_idx" ON "service_offerings"("company_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "service_offerings_company_id_name_key" ON "service_offerings"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_code_key" ON "appointments"("code");

-- CreateIndex
CREATE INDEX "appointments_company_id_status_idx" ON "appointments"("company_id", "status");

-- CreateIndex
CREATE INDEX "appointments_company_id_scheduled_date_idx" ON "appointments"("company_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "appointments_company_id_created_at_idx" ON "appointments"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "appointment_events_appointment_id_created_at_idx" ON "appointment_events"("appointment_id", "created_at");

-- AddForeignKey
ALTER TABLE "service_offerings" ADD CONSTRAINT "service_offerings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service_offerings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "company_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
