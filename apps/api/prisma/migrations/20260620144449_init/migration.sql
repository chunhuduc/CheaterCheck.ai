-- CreateTable
CREATE TABLE "signals" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "location" TEXT,
    "app" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Review',
    "detail" TEXT NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'Medium',
    "score" INTEGER NOT NULL DEFAULT 40,
    "image_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "app" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL,
    "confidence" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "matches" JSONB NOT NULL,
    "next_steps" JSONB NOT NULL,
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crawl_jobs" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "app" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "current_step" TEXT NOT NULL DEFAULT 'Queued',
    "profiles_found" INTEGER NOT NULL DEFAULT 0,
    "signals_generated" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crawl_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signals_full_name_app_idx" ON "signals"("full_name", "app");

-- CreateIndex
CREATE INDEX "signals_full_name_location_app_idx" ON "signals"("full_name", "location", "app");

-- CreateIndex
CREATE INDEX "crawl_jobs_status_priority_created_at_idx" ON "crawl_jobs"("status", "priority", "created_at");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "crawl_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
