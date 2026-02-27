"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
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
import { ArrowLeft, ArrowRight, Check, Calendar, Ruler, Scale, Target, Activity, User } from "lucide-react";

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
      protein: { grams: number; calories: number; percentage: number };
      fat: { grams: number; calories: number; percentage: number };
      carbs: { grams: number; calories: number; percentage: number };
    };
  }>;
  macros: {
    protein: { grams: number; calories: number; percentage: number };
    fat: { grams: number; calories: number; percentage: number };
    carbs: { grams: number; calories: number; percentage: number };
  };
  water: { liters: number; ml: number };
}

const initialState: CalFormState = {
  dateborn: "",
  sex: "",
  height: "",
  weight: "",
  mainGoal: "",
  goalWeight: "",
  activityLevel: "",
};

export default function StepperPage() {
  const [formData, setFormData] = useState<CalFormState>(initialState);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const updateFormData = (field: keyof CalFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!formData.dateborn) return "Please enter your date of birth";
        const birthDate = new Date(formData.dateborn);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (
          today.getMonth() - birthDate.getMonth() < 0 ||
          (today.getMonth() - birthDate.getMonth() === 0 &&
            today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        if (age < 1 || age > 120) return "Please enter a valid date of birth (age should be between 1-120)";
        return null;
      case 2:
        if (!formData.sex) return "Please select your gender";
        return null;
      case 3:
        if (!formData.height || Number(formData.height) <= 0) return "Please enter a valid height";
        if (Number(formData.height) < 50 || Number(formData.height) > 300) return "Height should be between 50-300 cm";
        return null;
      case 4:
        if (!formData.weight || Number(formData.weight) <= 0) return "Please enter a valid weight";
        if (Number(formData.weight) < 20 || Number(formData.weight) > 500) return "Weight should be between 20-500 kg";
        return null;
      case 5:
        if (!formData.mainGoal) return "Please select your main goal";
        return null;
      case 6:
        if (
          (formData.mainGoal === "lose weight" ||
            formData.mainGoal === "gain weight" ||
            formData.mainGoal === "build muscle") &&
          (!formData.goalWeight || Number(formData.goalWeight) <= 0)
        ) {
          return "Please enter your goal weight";
        }
        return null;
      case 7:
        if (!formData.activityLevel) return "Please select your activity level";
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast.error(error);
      return;
    }
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Only allow going back to previous steps
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleCalculate = async () => {
    const error = validateStep(currentStep);
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/calcount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateborn: formData.dateborn,
          sex: formData.sex,
          height: Number(formData.height),
          weight: Number(formData.weight),
          mainGoal: formData.mainGoal,
          goalWeight: formData.goalWeight ? Number(formData.goalWeight) : undefined,
          activityLevel: formData.activityLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to calculate calories");
      }

      setResult(data);
      setIsCompleted(true);
      setCurrentStep(8);
      toast.success("Calories calculated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to calculate calories",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialState);
    setResult(null);
    setCurrentStep(1);
    setIsCompleted(false);
  };

  // Show results step
  if (isCompleted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 bg-white dark:bg-slate-800 shadow-xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Your Results</h1>
              <p className="text-slate-600 dark:text-slate-300">Here's your personalized calorie plan</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Age</p>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{result.age} years</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400">BMI</p>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                    {result.bmi} - <span className="text-purple-600">{result.bmiStatus}</span>
                  </p>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-4">
                  <p className="text-sm text-orange-600 dark:text-orange-400">BMR</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{result.bmr} kcal/day</p>
                </div>

                <div className="bg-teal-50 dark:bg-teal-900/30 rounded-lg p-4">
                  <p className="text-sm text-teal-600 dark:text-teal-400">TDEE</p>
                  <p className="text-2xl font-bold text-teal-800 dark:text-teal-200">{result.tdee} kcal/day</p>
                </div>
              </div>

              {/* Right Column - Main Result */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                <p className="text-indigo-100 mb-1">Recommended Daily Calories</p>
                <p className="text-5xl font-bold mb-2">{result.recommendedCalories}</p>
                <p className="text-xl font-medium mb-4">kcal/day</p>
                <p className="text-indigo-100 text-sm mb-2">{result.adjustment}</p>
                <p className="text-indigo-200 text-sm font-semibold">{result.weightChangeMessage}</p>
              </div>

              {/* Macronutrients */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Macronutrients</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Protein</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{result.macros.protein.grams}g</p>
                    <p className="text-xs text-red-500">{result.macros.protein.percentage}%</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">Fat</p>
                    <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{result.macros.fat.grams}g</p>
                    <p className="text-xs text-yellow-500">{result.macros.fat.percentage}%</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Carbs</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{result.macros.carbs.grams}g</p>
                    <p className="text-xs text-green-500">{result.macros.carbs.percentage}%</p>
                  </div>
                </div>
              </div>

              {/* Water Intake */}
              <div className="md:col-span-2">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Water Intake</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{result.water.liters}L / day</p>
                  </div>
                  <div className="text-4xl">💧</div>
                </div>
              </div>
            </div>

            <Button onClick={handleReset} className="w-full mt-6" size="lg">
              Calculate Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Calorie Calculator
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Let's calculate your daily calorie needs step by step
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Step {currentStep} of 7
          </p>
        </div>

        <div className="mb-8">
          {/* Progress Bar */}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 7) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-800 shadow-xl">
          {/* Step 1: Date of Birth */}
          {currentStep === 1 && (
            <StepOneDateBorn
              value={formData.dateborn}
              onChange={(v) => updateFormData("dateborn", v)}
            />
          )}

          {/* Step 2: Gender */}
          {currentStep === 2 && (
            <StepTwoGender
              value={formData.sex}
              onChange={(v) => updateFormData("sex", v)}
            />
          )}

          {/* Step 3: Height */}
          {currentStep === 3 && (
            <StepThreeHeight
              value={formData.height}
              onChange={(v) => updateFormData("height", v)}
            />
          )}

          {/* Step 4: Weight */}
          {currentStep === 4 && (
            <StepFourWeight
              value={formData.weight}
              onChange={(v) => updateFormData("weight", v)}
            />
          )}

          {/* Step 5: Main Goal */}
          {currentStep === 5 && (
            <StepFiveGoal
              value={formData.mainGoal}
              onChange={(v) => updateFormData("mainGoal", v)}
            />
          )}

          {/* Step 6: Goal Weight */}
          {currentStep === 6 && (
            <StepSixGoalWeight
              value={formData.goalWeight}
              mainGoal={formData.mainGoal}
              onChange={(v) => updateFormData("goalWeight", v)}
            />
          )}

          {/* Step 7: Activity Level */}
          {currentStep === 7 && (
            <StepSevenActivity
              value={formData.activityLevel}
              onChange={(v) => updateFormData("activityLevel", v)}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < 7 ? (
              <Button
                onClick={handleNext}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCalculate}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                {isLoading ? "Calculating..." : "Calculate"}
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Summary of collected data */}
        <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Your Information:
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 dark:text-slate-400">
            {formData.dateborn && (
              <p>📅 DOB: {new Date(formData.dateborn).toLocaleDateString()}</p>
            )}
            {formData.sex && (
              <p>👤 Gender: {formData.sex === "male" ? "Male" : "Female"}</p>
            )}
            {formData.height && <p>📏 Height: {formData.height} cm</p>}
            {formData.weight && <p>⚖️ Weight: {formData.weight} kg</p>}
            {formData.mainGoal && (
              <p>🎯 Goal: {formData.mainGoal}</p>
            )}
            {formData.goalWeight && (
              <p>🏁 Goal Weight: {formData.goalWeight} kg</p>
            )}
            {formData.activityLevel && (
              <p>🏃 Activity: {formData.activityLevel}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Date of Birth
function StepOneDateBorn({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-3">
          <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          When were you born?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          We need your date of birth to calculate your age
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dateborn">Date of Birth</Label>
        <Input
          id="dateborn"
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-lg p-4"
          max={new Date().toISOString().split("T")[0]}
        />
      </div>
    </div>
  );
}

// Step 2: Gender
function StepTwoGender({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 mb-3">
          <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          What is your gender?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          This helps us calculate your metabolic rate accurately
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onChange("male")}
          className={`p-6 rounded-xl border-2 transition-all ${
            value === "male"
              ? "border-green-500 bg-green-50 dark:bg-green-900/30"
              : "border-slate-200 dark:border-slate-600 hover:border-green-300"
          }`}
        >
          <div className="text-4xl mb-2">👨</div>
          <p className="font-semibold text-slate-800 dark:text-white">Male</p>
        </button>
        <button
          onClick={() => onChange("female")}
          className={`p-6 rounded-xl border-2 transition-all ${
            value === "female"
              ? "border-green-500 bg-green-50 dark:bg-green-900/30"
              : "border-slate-200 dark:border-slate-600 hover:border-green-300"
          }`}
        >
          <div className="text-4xl mb-2">👩</div>
          <p className="font-semibold text-slate-800 dark:text-white">Female</p>
        </button>
      </div>
    </div>
  );
}

// Step 3: Height
function StepThreeHeight({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 mb-3">
          <Ruler className="w-6 h-6 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          What is your height?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Enter your height in centimeters
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="height">Height (cm)</Label>
        <Input
          id="height"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., 170"
          className="text-lg p-4"
          min="50"
          max="300"
        />
      </div>
      <div className="flex justify-between text-sm text-slate-500">
        <span>100cm</span>
        <span>150cm</span>
        <span>200cm</span>
      </div>
      <input
        type="range"
        min="100"
        max="220"
        value={Number(value) || 150}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
      />
    </div>
  );
}

// Step 4: Weight
function StepFourWeight({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 mb-3">
          <Scale className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          What is your weight?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Enter your weight in kilograms
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., 70"
          className="text-lg p-4"
          min="20"
          max="300"
        />
      </div>
      <div className="flex justify-between text-sm text-slate-500">
        <span>40kg</span>
        <span>70kg</span>
        <span>120kg</span>
      </div>
      <input
        type="range"
        min="40"
        max="150"
        value={Number(value) || 70}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
    </div>
  );
}

// Step 5: Main Goal
function StepFiveGoal({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const goals = [
    { value: "maintain weight", label: "Maintain Weight", emoji: "⚖️", desc: "Keep your current weight" },
    { value: "lose weight", label: "Lose Weight", emoji: "📉", desc: "Burn more calories than you eat" },
    { value: "gain weight", label: "Gain Weight", emoji: "📈", desc: "Eat more than you burn" },
    { value: "build muscle", label: "Build Muscle", emoji: "💪", desc: "Gain muscle mass" },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900 mb-3">
          <Target className="w-6 h-6 text-pink-600 dark:text-pink-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          What is your main goal?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Select the goal that best describes what you want to achieve
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {goals.map((goal) => (
          <button
            key={goal.value}
            onClick={() => onChange(goal.value)}
            className={`p-4 rounded-xl border-2 transition-all text-left ${
              value === goal.value
                ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                : "border-slate-200 dark:border-slate-600 hover:border-green-300"
            }`}
          >
            <div className="text-2xl mb-1">{goal.emoji}</div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">
              {goal.label}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {goal.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 6: Goal Weight (conditional)
function StepSixGoalWeight({
  value,
  mainGoal,
  onChange,
}: {
  value: string;
  mainGoal: string;
  onChange: (value: string) => void;
}) {
  if (!mainGoal || mainGoal === "maintain weight") {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 mb-3">
            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Goal Weight Not Required
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Since you selected "Maintain Weight", you can skip this step
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
          <p className="text-green-700 dark:text-green-300">
            Click "Next" to continue to activity level
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 mb-3">
          <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          What is your goal weight?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Enter the weight you want to achieve
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
        <Input
          id="goalWeight"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., 65"
          className="text-lg p-4"
          min="20"
          max="300"
        />
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
        💡 Tip: A healthy weight loss/gain is 0.5-1 kg per week
      </div>
    </div>
  );
}

// Step 7: Activity Level
function StepSevenActivity({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const activities = [
    {
      value: "light",
      label: "Light",
      emoji: "🚶",
      desc: "Desk job, little exercise",
    },
    {
      value: "moderately active",
      label: "Moderate",
      emoji: "🏃",
      desc: "Active job, exercise 3-5 times/week",
    },
    {
      value: "very active",
      label: "Very Active",
      emoji: "🏋️",
      desc: "Physical job, intense exercise daily",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900 mb-3">
          <Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          How active are you?
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          This helps us calculate your total daily energy expenditure
        </p>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => (
          <button
            key={activity.value}
            onClick={() => onChange(activity.value)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
              value === activity.value
                ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                : "border-slate-200 dark:border-slate-600 hover:border-green-300"
            }`}
          >
            <div className="text-3xl">{activity.emoji}</div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-white">
                {activity.label}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {activity.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
