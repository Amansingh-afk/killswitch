-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "dhan_client_id" TEXT,
    "access_token_encrypted" TEXT,
    "risk_threshold" DECIMAL(5,2) NOT NULL DEFAULT 2.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "daily_risk_state" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trading_date" DATE NOT NULL,
    "mtm" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "invested" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "loss_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "kill_status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_risk_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kill_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trigger_mtm" DECIMAL(15,2),
    "trigger_loss_percent" DECIMAL(5,2),
    "execution_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kill_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "daily_risk_state_user_id_trading_date_key" ON "daily_risk_state"("user_id", "trading_date");

-- AddForeignKey
ALTER TABLE "daily_risk_state" ADD CONSTRAINT "daily_risk_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kill_events" ADD CONSTRAINT "kill_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
