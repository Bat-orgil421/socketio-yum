import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

interface CalcountRequest {
  dateborn: string;
  sex: "male" | "female";
  height: number;
  weight: number;
  mainGoal: "gain weight" | "lose weight" | "maintain weight" | "build muscle";
  goalWeight?: number;
  activityLevel: "light" | "moderately active" | "very active";
}

interface MacroBreakdown {
  grams: number;
  calories: number;
  percentage: number;
}

interface Macros {
  protein: MacroBreakdown;
  fat: MacroBreakdown;
  carbs: MacroBreakdown;
}

interface GoalScenario {
  pace: "slow" | "normal" | "fast";
  weeklyWeightChange: number;
  monthlyWeightChange: number;
  timeToGoal: {
    weeks: number;
    months: number;
  };
  dailyCalories: number;
  calorieAdjustment: number;
  macros: Macros;
}

// Helper function to calculate macros for a given calorie target
function calculateMacros(
  calories: number,
  goal: string,
  weight: number,
): Macros {
  let proteinFactor: number;
  if (goal === "build muscle") {
    proteinFactor = 2.0;
  } else if (goal === "lose weight") {
    proteinFactor = 2.0;
  } else {
    proteinFactor = 1.8;
  }
  const proteinGrams = Math.round(weight * proteinFactor);
  const proteinCalories = proteinGrams * 4;

  const fatPercentage = goal === "build muscle" ? 0.22 : 0.25;
  const fatCalories = Math.round(calories * fatPercentage);
  const fatGrams = Math.round(fatCalories / 9);

  const carbCalories = Math.round(calories - proteinCalories - fatCalories);
  const carbGrams = Math.round(carbCalories / 4);

  return {
    protein: {
      grams: proteinGrams,
      calories: proteinCalories,
      percentage: Math.round((proteinCalories / calories) * 100),
    },
    fat: {
      grams: fatGrams,
      calories: fatCalories,
      percentage: Math.round((fatCalories / calories) * 100),
    },
    carbs: {
      grams: carbGrams,
      calories: carbCalories,
      percentage: Math.round((carbCalories / calories) * 100),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get the current authenticated user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    const body: CalcountRequest = await request.json();

    // Validation
    if (
      !body.dateborn ||
      !body.sex ||
      !body.height ||
      !body.weight ||
      !body.mainGoal ||
      !body.activityLevel
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Calculate age from dateborn
    const birthDate = new Date(body.dateborn);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 10 || age > 70) {
      return NextResponse.json(
        { error: "Invalid date of birth" },
        { status: 400 },
      );
    }

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    const weight = Number(body.weight);
    const height = Number(body.height);

    if (body.sex === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      light: 1.375,
      "moderately active": 1.55,
      "very active": 1.725,
    };

    const tdee = bmr * activityMultipliers[body.activityLevel];

    // Calculate BMI
    const heightMeters = height / 100;
    const bmi = Math.round((weight / (heightMeters * heightMeters)) * 10) / 10;

    let bmiStatus: string;
    let bmiMessage: string;

    if (bmi < 18.5) {
      bmiStatus = "Underweight";
      bmiMessage =
        "You are below a healthy weight range. Consider consulting a nutritionist.";
    } else if (bmi < 25) {
      bmiStatus = "Normal";
      bmiMessage = "You are currently in a healthy weight range.";
    } else if (bmi < 30) {
      bmiStatus = "Overweight";
      bmiMessage =
        "You are above a healthy weight range. Consider gradual weight loss.";
    } else {
      bmiStatus = "Obese";
      bmiMessage =
        "You are significantly above a healthy weight range. Consult a healthcare provider.";
    }

    // Safety check for teenagers
    const isTeenager = age < 18;
    let safetyWarning = "";
    let adjustedRecommendedCalories = tdee;
    let adjustment = "";

    if (body.mainGoal === "lose weight") {
      const deficit = isTeenager ? 300 : 500; // Safer for teenagers
      adjustedRecommendedCalories = tdee - deficit;
      adjustment = `Calorie deficit of ${deficit} kcal/day for gradual weight loss`;
      if (isTeenager) {
        safetyWarning =
          "⚠️ Teenage nutrition: Moderate deficit recommended. Consult a doctor before extreme dieting.";
      }
    } else if (body.mainGoal === "gain weight") {
      const surplus = isTeenager ? 300 : 500; // Safer for teenagers
      adjustedRecommendedCalories = tdee + surplus;
      adjustment = `Calorie surplus of ${surplus} kcal/day for gradual weight gain`;
      if (isTeenager) {
        safetyWarning =
          "⚠️ Teenage nutrition: Moderate surplus recommended. Focus on nutrient-dense foods.";
      }
    } else if (body.mainGoal === "build muscle") {
      adjustedRecommendedCalories = tdee + 300;
      adjustment = "Calorie surplus of 300 kcal/day for muscle building";
      if (isTeenager) {
        safetyWarning =
          "⚠️ Teenage nutrition: Ensure adequate protein and strength training. Consult a coach.";
      }
    } else {
      adjustment = "Maintain current calorie intake";
    }

    const recommendedCalories = adjustedRecommendedCalories;

    // ✅ CORRECT MACRO CALCULATION (Production-level)
    // Step 1: Calculate protein based on weight and goal
    let proteinFactor: number;
    if (body.mainGoal === "build muscle") {
      proteinFactor = 2.0; // 2.0g per kg for muscle building (optimized)
    } else if (body.mainGoal === "lose weight") {
      proteinFactor = 2.0; // 2.0g per kg for weight loss (preserve muscle)
    } else {
      proteinFactor = 1.8; // 1.8g per kg for maintenance/gain
    }
    const proteinGrams = Math.round(weight * proteinFactor);
    const proteinCalories = proteinGrams * 4; // 1g protein = 4 kcal

    // Step 2: Calculate fat (20-25% of total calories for build muscle, 25% for others)
    const fatPercentage = body.mainGoal === "build muscle" ? 0.22 : 0.25; // Slightly lower for muscle building
    const fatCalories = Math.round(recommendedCalories * fatPercentage);
    const fatGrams = Math.round(fatCalories / 9); // 1g fat = 9 kcal

    // Step 3: Calculate carbs (remaining calories)
    const carbCalories = Math.round(
      recommendedCalories - proteinCalories - fatCalories,
    );
    const carbGrams = Math.round(carbCalories / 4); // 1g carbs = 4 kcal

    // Step 4: Water intake (35ml per kg of body weight)
    const waterIntakeLiters = Math.round((weight * 35) / 100) / 10; // Convert to liters

    // Step 5: Estimate rate of change
    const caloriesDelta = recommendedCalories - tdee;
    let weightChangeRate = 0;
    let weightChangeMessage = "";

    if (body.mainGoal === "lose weight") {
      // ~0.5kg per week per 500 kcal deficit
      weightChangeRate = (Math.abs(caloriesDelta) / 500) * 0.5;
      weightChangeMessage = `Expected weight loss: ~${weightChangeRate.toFixed(
        1,
      )} kg/week`;
    } else if (body.mainGoal === "gain weight") {
      // ~0.5kg per week per 500 kcal surplus
      weightChangeRate = (caloriesDelta / 500) * 0.5;
      weightChangeMessage = `Expected weight gain: ~${weightChangeRate.toFixed(
        1,
      )} kg/week`;
    } else if (body.mainGoal === "build muscle") {
      // ~0.25-0.4kg lean mass per week per 300 kcal surplus (only 25% is muscle)
      weightChangeRate = (caloriesDelta / 300) * 0.3;
      weightChangeMessage = `Expected lean mass gain: ~${weightChangeRate.toFixed(
        1,
      )} kg/month`;
    }

    // Step 6: Calculate goal weight scenarios if goalWeight is provided
    let goalWeightScenarios: GoalScenario[] = [];

    if (body.goalWeight && body.goalWeight !== weight) {
      const weightDifference = Math.abs(body.goalWeight - weight);
      const isLosing = body.goalWeight < weight;

      // Define pace rates (kg per week)
      const paces = [
        { pace: "fast" as const, rate: 1.0 },
        { pace: "normal" as const, rate: 0.5 },
        { pace: "slow" as const, rate: 0.25 },
      ];

      for (const { pace, rate } of paces) {
        const weeksToGoal = Math.round(weightDifference / rate);
        const monthsToGoal = Math.round(weeksToGoal / 4.33);

        // Calculate calorie adjustment needed
        // 1kg loss = 7000 kcal deficit, 1kg gain = 7000 kcal surplus
        const calorieAdjustmentPerWeek = rate * 7000;
        const scenarioCalorieDaily = isLosing
          ? tdee - calorieAdjustmentPerWeek / 7
          : tdee + calorieAdjustmentPerWeek / 7;

        const scenarioMacros = calculateMacros(
          Math.round(scenarioCalorieDaily),
          body.mainGoal,
          weight,
        );

        goalWeightScenarios.push({
          pace,
          weeklyWeightChange: isLosing ? -rate : rate,
          monthlyWeightChange: isLosing ? -rate * 4.33 : rate * 4.33,
          timeToGoal: {
            weeks: weeksToGoal,
            months: monthsToGoal,
          },
          dailyCalories: Math.round(scenarioCalorieDaily),
          calorieAdjustment: isLosing
            ? -Math.round(calorieAdjustmentPerWeek / 7)
            : Math.round(calorieAdjustmentPerWeek / 7),
          macros: scenarioMacros,
        });
      }
    }

    // Find or create the user in the database
    let dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!dbUser) {
      // Create the user if they don't exist
      const name =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "User";
      dbUser = await prisma.user.create({
        data: {
          email: userEmail,
          name,
        },
      });
    }

    // Check if health profile exists first
    const existingProfile = await prisma.userHealthProfile.findUnique({
      where: { userId: dbUser.id },
    });

    let healthProfile;
    if (existingProfile) {
      // Update existing profile
      healthProfile = await prisma.userHealthProfile.update({
        where: { userId: dbUser.id },
        data: {
          age,
          sex: body.sex,
          height: height,
          weight: weight,
          mainGoal: body.mainGoal,
          goalWeight: body.goalWeight || null,
          activityLevel: body.activityLevel,
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          recommendedCalories: Math.round(recommendedCalories),
          proteinGrams,
          proteinCalories,
          fatGrams,
          fatCalories,
          carbsGrams: carbGrams,
          carbsCalories: carbCalories,
          waterLiters: waterIntakeLiters,
          bmi,
          bmiStatus,
        },
      });
    } else {
      // Create new profile
      healthProfile = await prisma.userHealthProfile.create({
        data: {
          userId: dbUser.id,
          age,
          sex: body.sex,
          height: height,
          weight: weight,
          mainGoal: body.mainGoal,
          goalWeight: body.goalWeight || null,
          activityLevel: body.activityLevel,
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          recommendedCalories: Math.round(recommendedCalories),
          proteinGrams,
          proteinCalories,
          fatGrams,
          fatCalories,
          carbsGrams: carbGrams,
          carbsCalories: carbCalories,
          waterLiters: waterIntakeLiters,
          bmi,
          bmiStatus,
        },
      });
    }

    return NextResponse.json({
      age,
      isTeenager,
      bmi,
      bmiStatus,
      bmiMessage,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      recommendedCalories: Math.round(recommendedCalories),
      adjustment,
      safetyWarning,
      goal: body.mainGoal,
      weightChangeMessage,
      goalWeightScenarios,
      macros: {
        protein: {
          grams: proteinGrams,
          calories: proteinCalories,
          percentage: Math.round((proteinCalories / recommendedCalories) * 100),
        },
        fat: {
          grams: fatGrams,
          calories: fatCalories,
          percentage: Math.round((fatCalories / recommendedCalories) * 100),
        },
        carbs: {
          grams: carbGrams,
          calories: carbCalories,
          percentage: Math.round((carbCalories / recommendedCalories) * 100),
        },
      },
      water: {
        liters: waterIntakeLiters,
        ml: Math.round(weight * 35),
      },
      healthProfileId: healthProfile.id,
    });
  } catch (error) {
    console.error("Calcount error:", error);
    return NextResponse.json(
      { error: "Failed to calculate calories" },
      { status: 500 },
    );
  }
}
