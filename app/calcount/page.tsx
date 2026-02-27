"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CalFormState {
  dateborn: string;
  sex: string;
  height: string;
  weight: string;
  mainGoal: string;
  goalWeight: string;
  activityLevel: string;
}

interface CalcResult {
  age: number;
  isTeenager: boolean;
  bmi: number;
  bmiStatus: string;
  bmiMessage: string;
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  adjustment: string;
  safetyWarning: string;
  goal: string;
  weightChangeMessage: string;
  goalWeightScenarios: Array<{
    pace: "slow" | "normal" | "fast";
    weeklyWeightChange: number;
    monthlyWeightChange: number;
    timeToGoal: {
      weeks: number;
      months: number;
    };
    dailyCalories: number;
    calorieAdjustment: number;
    macros: {
      protein: {
        grams: number;
        calories: number;
        percentage: number;
      };
      fat: {
        grams: number;
        calories: number;
        percentage: number;
      };
      carbs: {
        grams: number;
        calories: number;
        percentage: number;
      };
    };
  }>;
  macros: {
    protein: {
      grams: number;
      calories: number;
      percentage: number;
    };
    fat: {
      grams: number;
      calories: number;
      percentage: number;
    };
    carbs: {
      grams: number;
      calories: number;
      percentage: number;
    };
  };
  water: {
    liters: number;
    ml: number;
  };
}

const initialFoodState: CalFormState = {
  dateborn: "",
  sex: "",
  height: "",
  weight: "",
  mainGoal: "",
  goalWeight: "",
  activityLevel: "",
};

export default function QuizCard() {
  const [calform, setCalForm] = useState<CalFormState>(initialFoodState);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): string | null => {
    if (!calform.dateborn) return "Please enter your date of birth";
    if (!calform.sex) return "Please select your gender";
    if (!calform.height || Number(calform.height) <= 0)
      return "Please enter a valid height";
    if (!calform.weight || Number(calform.weight) <= 0)
      return "Please enter a valid weight";
    if (!calform.mainGoal) return "Please select your main goal";
    if (!calform.activityLevel) return "Please select your activity level";

    const birthDate = new Date(calform.dateborn);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (
      today.getMonth() - birthDate.getMonth() < 0 ||
      (today.getMonth() - birthDate.getMonth() === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 1 || age > 120)
      return "Please enter a valid date of birth (age should be between 1-120)";

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/calcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateborn: calform.dateborn,
          sex: calform.sex,
          height: Number(calform.height),
          weight: Number(calform.weight),
          mainGoal: calform.mainGoal,
          goalWeight: calform.goalWeight
            ? Number(calform.goalWeight)
            : undefined,
          activityLevel: calform.activityLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to calculate calories");
      }

      setResult(data);
      toast.success("Calories calculated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to calculate calories",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalFormChange = (field: keyof CalFormState, value: string) => {
    setCalForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Calorie Calculator</h1>
      <p className="text-gray-600 mb-6">
        Calculate your daily calorie needs based on your personal information
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="dateborn">Date of Birth</Label>
            <Input
              id="dateborn"
              type="date"
              value={calform.dateborn}
              onChange={(event) =>
                handleCalFormChange("dateborn", event.target.value)
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sex">Sex / Gender</Label>
            <Select
              value={calform.sex}
              onValueChange={(value: string) =>
                handleCalFormChange("sex", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              value={calform.height}
              onChange={(e) => handleCalFormChange("height", e.target.value)}
              placeholder="e.g., 170"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={calform.weight}
              onChange={(e) => handleCalFormChange("weight", e.target.value)}
              placeholder="e.g., 70"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mainGoal">What's your main goal?</Label>
            <Select
              value={calform.mainGoal}
              onValueChange={(value: string) =>
                handleCalFormChange("mainGoal", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintain weight">Maintain Weight</SelectItem>
                <SelectItem value="lose weight">Lose Weight</SelectItem>
                <SelectItem value="gain weight">Gain Weight</SelectItem>
                <SelectItem value="build muscle">Build Muscle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(calform.mainGoal === "lose weight" ||
            calform.mainGoal === "gain weight" ||
            calform.mainGoal === "build muscle") && (
            <div className="grid gap-2">
              <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
              <Input
                id="goalWeight"
                type="number"
                value={calform.goalWeight}
                onChange={(e) =>
                  handleCalFormChange("goalWeight", e.target.value)
                }
                placeholder="e.g., 65"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="activityLevel">How active are you?</Label>
            <Select
              value={calform.activityLevel}
              onValueChange={(value: string) =>
                handleCalFormChange("activityLevel", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Activity Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  Light (e.g., desk job, light exercise 1-3 times/week)
                </SelectItem>
                <SelectItem value="moderately active">
                  Moderately Active (e.g., active job, exercise 3-5 times/week)
                </SelectItem>
                <SelectItem value="very active">
                  Very Active (e.g., physical job, intense exercise 6-7
                  times/week)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Calculating..." : "Calculate Calories"}
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold mb-4">Your Results</h2>

              <div className="space-y-3">
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="text-xl font-semibold">{result.age} years</p>
                </div>

                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">BMI (Body Mass Index)</p>
                  <p className="text-xl font-semibold">
                    {result.bmi} -{" "}
                    <span className="text-indigo-600">{result.bmiStatus}</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {result.bmiMessage}
                  </p>
                </div>

                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">
                    Basal Metabolic Rate (BMR)
                  </p>
                  <p className="text-xl font-semibold">{result.bmr} kcal/day</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Calories burned at rest
                  </p>
                </div>

                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">
                    Total Daily Energy Expenditure (TDEE)
                  </p>
                  <p className="text-xl font-semibold">
                    {result.tdee} kcal/day
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Calories burned with activity
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-indigo-200 mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Recommended Daily Calories
                  </p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {result.recommendedCalories} kcal/day
                  </p>
                  <p className="text-sm text-gray-700 mt-3 font-medium">
                    {result.adjustment}
                  </p>
                  <p className="text-xs text-indigo-600 mt-2 font-semibold">
                    {result.weightChangeMessage}
                  </p>
                </div>

                {/* Safety Warning for Teenagers */}
                {result.isTeenager && result.safetyWarning && (
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-300 mb-4">
                    <p className="text-sm text-yellow-800">
                      {result.safetyWarning}
                    </p>
                  </div>
                )}

                {/* Macronutrients Breakdown */}
                {result.macros && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-lg font-bold mb-3">Macronutrients</h3>

                    {/* Protein */}
                    <div className="bg-red-50 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-red-700">
                          Protein
                        </span>
                        <span className="text-sm text-red-600">
                          {result.macros.protein.percentage}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-red-600 mb-1">
                        {result.macros.protein.grams}g
                      </p>
                      <p className="text-xs text-gray-600">
                        {result.macros.protein.calories} kcal
                      </p>
                    </div>

                    {/* Fat */}
                    <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-yellow-700">
                          Fat
                        </span>
                        <span className="text-sm text-yellow-600">
                          {result.macros.fat.percentage}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600 mb-1">
                        {result.macros.fat.grams}g
                      </p>
                      <p className="text-xs text-gray-600">
                        {result.macros.fat.calories} kcal
                      </p>
                    </div>

                    {/* Carbs */}
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-green-700">
                          Carbs
                        </span>
                        <span className="text-sm text-green-600">
                          {result.macros.carbs.percentage}%
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mb-1">
                        {result.macros.carbs.grams}g
                      </p>
                      <p className="text-xs text-gray-600">
                        {result.macros.carbs.calories} kcal
                      </p>
                    </div>

                    {/* Water Intake */}
                    {result.water && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-blue-700">
                            Water Intake
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mb-1">
                          {result.water.liters}L
                        </p>
                        <p className="text-xs text-gray-600">
                          {result.water.ml}ml per day
                        </p>
                      </div>
                    )}

                    {/* Goal Weight Scenarios */}
                    {result.goalWeightScenarios &&
                      result.goalWeightScenarios.length > 0 && (
                        <div className="mt-6 pt-4 border-t">
                          <h3 className="text-lg font-bold mb-3">
                            Goal Weight Timeline & Macros
                          </h3>
                          <div className="space-y-3">
                            {result.goalWeightScenarios.map((scenario) => (
                              <div
                                key={scenario.pace}
                                className={`rounded-lg p-4 border-2 ${
                                  scenario.pace === "normal"
                                    ? "bg-purple-50 border-purple-300"
                                    : scenario.pace === "fast"
                                    ? "bg-red-50 border-red-300"
                                    : "bg-orange-50 border-orange-300"
                                }`}
                              >
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-bold capitalize text-lg">
                                    {scenario.pace === "fast"
                                      ? "🚀 Fast Mode"
                                      : scenario.pace === "normal"
                                      ? "⚡ Normal Mode"
                                      : "🐢 Slow Mode"}
                                  </h4>
                                  <span className="text-sm font-semibold">
                                    {scenario.pace === "normal" &&
                                      "Recommended"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                  <div>
                                    <p className="text-gray-600">
                                      Weekly Change
                                    </p>
                                    <p className="font-bold">
                                      {scenario.weeklyWeightChange.toFixed(2)}{" "}
                                      kg/week
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">
                                      Time to Goal
                                    </p>
                                    <p className="font-bold">
                                      {scenario.timeToGoal.weeks}w /{" "}
                                      {scenario.timeToGoal.months}m
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-white rounded p-3 mb-3 border">
                                  <p className="text-sm text-gray-600 mb-1">
                                    Daily Calories
                                  </p>
                                  <p className="text-2xl font-bold">
                                    {scenario.dailyCalories} kcal
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    ({scenario.calorieAdjustment > 0 ? "+" : ""}
                                    {scenario.calorieAdjustment} from TDEE)
                                  </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div className="bg-red-100 rounded p-2">
                                    <p className="text-gray-800 font-semibold">
                                      Protein
                                    </p>
                                    <p className="font-bold text-red-800">
                                      {scenario.macros.protein.grams}g
                                    </p>
                                    <p className="text-xs text-gray-700">
                                      {scenario.macros.protein.percentage}%
                                    </p>
                                  </div>
                                  <div className="bg-yellow-100 rounded p-2">
                                    <p className="text-gray-800 font-semibold">
                                      Fat
                                    </p>
                                    <p className="font-bold text-amber-800">
                                      {scenario.macros.fat.grams}g
                                    </p>
                                    <p className="text-xs text-gray-700">
                                      {scenario.macros.fat.percentage}%
                                    </p>
                                  </div>
                                  <div className="bg-green-100 rounded p-2">
                                    <p className="text-gray-800 font-semibold">
                                      Carbs
                                    </p>
                                    <p className="font-bold text-green-800">
                                      {scenario.macros.carbs.grams}g
                                    </p>
                                    <p className="text-xs text-gray-700">
                                      {scenario.macros.carbs.percentage}%
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </Card>

            <Button
              onClick={() => {
                setResult(null);
                setCalForm(initialFoodState);
              }}
              variant="outline"
              className="w-full"
            >
              Calculate Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
