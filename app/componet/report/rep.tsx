"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";

type HealthProfile = {
  id: number;
  userId: number;
  age: number;
  sex: string;
  height: number;
  weight: number;
  mainGoal: string;
  goalWeight: number | null;
  activityLevel: string;
  bmr: number | null;
  tdee: number | null;
  recommendedCalories: number | null;
  proteinGrams: number | null;
  proteinCalories: number | null;
  fatGrams: number | null;
  fatCalories: number | null;
  carbsGrams: number | null;
  carbsCalories: number | null;
  waterLiters: number | null;
  bmi: number | null;
  bmiStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Report() {
  const [healthProfile, setHealthProfile] = useState<HealthProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch health profile data
    fetch("/api/healthprofile")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Health profile not found");
        }
        return res.json();
      })
      .then((data) => {
        setHealthProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching health profile:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getGoalText = (goal: string) => {
    switch (goal) {
      case "lose weight":
        return "Lose Weight";
      case "gain weight":
        return "Gain Weight";
      case "build muscle":
        return "Build Muscle";
      case "maintain weight":
        return "Maintain Weight";
      default:
        return goal;
    }
  };

  const getActivityText = (level: string) => {
    switch (level) {
      case "light":
        return "Lightly Active";
      case "moderately active":
        return "Moderately Active";
      case "very active":
        return "Very Active";
      default:
        return level;
    }
  };

  if (loading) {
    return (
      <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Health Report
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Your personalized health data
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      </section>
    );
  }

  if (error || !healthProfile) {
    return (
      <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Health Report
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Your personalized health data
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 p-6 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            No health data yet
          </p>
          <a
            href="/calcount"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Link2 className="h-4 w-4" />
            Get Your Health Report
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Health Report
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Your personalized health data
          </div>
        </div>
        <a
          href="/calcount"
          className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          ✏️
        </a>
      </div>

      <div className="mt-4 space-y-3">
        {/* Main Goal Card */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
          <div className="text-xs font-medium uppercase tracking-wide opacity-90">
            Current Goal
          </div>
          <div className="mt-1 text-xl font-bold">
            {getGoalText(healthProfile.mainGoal)}
          </div>
          {healthProfile.goalWeight && (
            <div className="mt-2 text-sm opacity-80">
              Goal: {healthProfile.goalWeight} kg
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Age */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Age</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {healthProfile.age} years
            </div>
          </div>

          {/* Sex */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Sex</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize">
              {healthProfile.sex}
            </div>
          </div>

          {/* Height */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Height
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {healthProfile.height} cm
            </div>
          </div>

          {/* Weight */}
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Weight
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {healthProfile.weight} kg
            </div>
          </div>
        </div>

        {/* Calories Card */}
        {healthProfile.recommendedCalories && (
          <div className="rounded-xl bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-4">
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">
              Daily Calories
            </div>
            <div className="mt-1 text-2xl font-bold text-orange-700 dark:text-orange-300">
              {healthProfile.recommendedCalories} <span className="text-sm font-normal">kcal</span>
            </div>
            {healthProfile.bmiStatus && (
              <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                BMI: {healthProfile.bmi} ({healthProfile.bmiStatus})
              </div>
            )}
          </div>
        )}

        {/* Macros Grid */}
        {healthProfile.proteinGrams && (
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-center">
              <div className="text-xs text-red-600 dark:text-red-400 font-medium">Protein</div>
              <div className="text-lg font-bold text-red-700 dark:text-red-300">
                {healthProfile.proteinGrams}g
              </div>
              <div className="text-xs text-red-500 dark:text-red-400">
                {healthProfile.proteinCalories} kcal
              </div>
            </div>
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/30 p-3 text-center">
              <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Fat</div>
              <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {healthProfile.fatGrams}g
              </div>
              <div className="text-xs text-yellow-500 dark:text-yellow-400">
                {healthProfile.fatCalories} kcal
              </div>
            </div>
            <div className="rounded-xl bg-green-50 dark:bg-green-950/30 p-3 text-center">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">Carbs</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                {healthProfile.carbsGrams}g
              </div>
              <div className="text-xs text-green-500 dark:text-green-400">
                {healthProfile.carbsCalories} kcal
              </div>
            </div>
          </div>
        )}

        {/* Water Intake */}
        {healthProfile.waterLiters && (
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3">
            <div className="text-xs text-blue-600 dark:text-blue-400">Daily Water</div>
            <div className="text-base font-semibold text-blue-700 dark:text-blue-300">
              {healthProfile.waterLiters} liters
            </div>
          </div>
        )}

        {/* Activity Level */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Activity Level
          </div>
          <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {getActivityText(healthProfile.activityLevel)}
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          Last updated: {new Date(healthProfile.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </section>
  );
}
