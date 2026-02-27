"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      const timer = setTimeout(() => {
        router.push("/home");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [router, isSignedIn]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <SignedOut>
          <h1 className="text-3xl font-semibold mb-4">Welcome to YumYum</h1>
          <p className="mb-6">Please sign in to continue.</p>
          <SignInButton mode="modal">
            <button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <h1 className="text-3xl font-semibold mb-4">Welcome back!</h1>
          <p className="mb-6">Redirecting to your dashboard...</p>
          <UserButton />
        </SignedIn>
      </main>
    </div>
  );
}

// If you are sedentary (little or no exercise) : Calorie-Calculation = BMR x 1.2
// If you are lightly active (light exercise/sports 1-3 days/week) : Calorie-Calculation = BMR x 1.375
// If you are moderately active (moderate exercise/sports 3-5 days/week) : Calorie-Calculation = BMR x 1.55
// If you are very active (hard exercise/sports 6-7 days a week) : Calorie-Calculation = BMR x 1.725
// If you are extra active (very hard exercise/sports & physical job or 2x training) : Calorie-Calculation = BMR x 1.9
// For example If you are sedentary, and your BMR equal 1745 so the total number of calories you need in order to maintain your current weight = 1745*1.2 = 2094.
