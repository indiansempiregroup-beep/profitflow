/*
  Warnings:

  - Added the required column `buyPrice` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidence` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feeAnalysis` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liquidityScore` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marketType` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellPrice` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slippageEstimate` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceDataTimestamp` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `spreadPercentage` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.
  - Added the required column `validatedAt` to the `arbitrage_opportunities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "arbitrage_opportunities" ADD COLUMN     "buyPrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "feeAnalysis" JSONB NOT NULL,
ADD COLUMN     "liquidityScore" JSONB NOT NULL,
ADD COLUMN     "marketType" TEXT NOT NULL,
ADD COLUMN     "sellPrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "slippageEstimate" JSONB NOT NULL,
ADD COLUMN     "sourceDataTimestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "spreadPercentage" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "validatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "detectedAt" DROP DEFAULT;
