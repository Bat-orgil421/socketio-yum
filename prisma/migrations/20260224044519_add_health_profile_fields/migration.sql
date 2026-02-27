-- AlterTable
ALTER TABLE "UserHealthProfile" ADD COLUMN     "bmi" DOUBLE PRECISION,
ADD COLUMN     "bmiStatus" TEXT,
ADD COLUMN     "bmr" INTEGER,
ADD COLUMN     "carbsCalories" INTEGER,
ADD COLUMN     "carbsGrams" INTEGER,
ADD COLUMN     "fatCalories" INTEGER,
ADD COLUMN     "fatGrams" INTEGER,
ADD COLUMN     "proteinCalories" INTEGER,
ADD COLUMN     "proteinGrams" INTEGER,
ADD COLUMN     "recommendedCalories" INTEGER,
ADD COLUMN     "tdee" INTEGER,
ADD COLUMN     "waterLiters" DOUBLE PRECISION;
