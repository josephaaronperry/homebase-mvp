-- CreateTable
CREATE TABLE "pre_approvals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "annualIncome" DECIMAL(14,2) NOT NULL,
    "monthlyDebts" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditScoreRange" TEXT NOT NULL,
    "downPaymentAmount" DECIMAL(14,2) NOT NULL,
    "purchaseTimeline" TEXT NOT NULL,
    "estimatedMin" DECIMAL(14,2),
    "estimatedMax" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pre_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buying_pipelines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "offerId" TEXT,
    "currentStage" TEXT NOT NULL DEFAULT 'pre_approval',
    "stageCompletedAt" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buying_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lender_selections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buyingPipelineId" TEXT NOT NULL,
    "lenderName" TEXT NOT NULL,
    "lenderLoanType" TEXT,
    "interestRate" DECIMAL(5,2),
    "estimatedMonthlyPayment" DECIMAL(12,2),
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lender_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buyingPipelineId" TEXT NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "inspectorRating" DECIMAL(3,1),
    "price" DECIMAL(10,2),
    "scheduledDate" DATE NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pre_approvals_userId_idx" ON "pre_approvals"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "buying_pipelines_userId_propertyId_key" ON "buying_pipelines"("userId", "propertyId");
CREATE INDEX "buying_pipelines_userId_idx" ON "buying_pipelines"("userId");
CREATE INDEX "buying_pipelines_propertyId_idx" ON "buying_pipelines"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "lender_selections_buyingPipelineId_key" ON "lender_selections"("buyingPipelineId");
CREATE INDEX "lender_selections_userId_idx" ON "lender_selections"("userId");

-- CreateIndex
CREATE INDEX "inspections_userId_idx" ON "inspections"("userId");
CREATE INDEX "inspections_buyingPipelineId_idx" ON "inspections"("buyingPipelineId");

-- AddForeignKey
ALTER TABLE "pre_approvals" ADD CONSTRAINT "pre_approvals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buying_pipelines" ADD CONSTRAINT "buying_pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buying_pipelines" ADD CONSTRAINT "buying_pipelines_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "buying_pipelines" ADD CONSTRAINT "buying_pipelines_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lender_selections" ADD CONSTRAINT "lender_selections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lender_selections" ADD CONSTRAINT "lender_selections_buyingPipelineId_fkey" FOREIGN KEY ("buyingPipelineId") REFERENCES "buying_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_buyingPipelineId_fkey" FOREIGN KEY ("buyingPipelineId") REFERENCES "buying_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
