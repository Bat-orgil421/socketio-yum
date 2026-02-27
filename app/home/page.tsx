"use client";

import { useMemo, useState, useEffect } from "react";
import Navbar from "../navbar/navber";
import { Apple, Dumbbell, Map, Utensils } from "lucide-react";
import Schedule from "../componet/schedule/schedule";
import Report from "../componet/report/rep";
import Leaderboard from "../componet/leaderboard/ldrbrd";
import { SpeedInsights } from "@vercel/speed-insights/next";

type ScheduleItem = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  activity: string;
  completed: boolean;
};

type UserData = {
  name: string;
  streak?: number;
  points?: number;
};

export default function Page() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [userName, setUserName] = useState("User");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState<
    Array<{ id: number; name: string; points: number; rank: number }>
  >([]);

  // Force re-render every second to update time-based colors
  const [, setTick] = useState(0);
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toTimeString().slice(0, 5));
      setTick((t) => t + 1); // Force re-render
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // Ensure user is DB and fetch user data
    fetch("/api/users", { method: "POST" })
      .then((res) => {
        if (!res.ok) {
          console.error("Failed to ensure user in DB");
        }
        return fetch("/api/users");
      })
      .then((res) => res.json())
      .then((data: UserData) => {
        if (data.name) {
          setUserName(data.name);
        }
        if (data.streak !== undefined) {
          setStreak(data.streak);
        }
        if (data.points !== undefined) {
          setPoints(data.points);
        }
      })
      .catch((err) => console.error("Error ensuring user:", err));

    // Update streak and points on daily visit
    fetch("/api/users/streak", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.streak !== undefined) {
          setStreak(data.streak);
        }
        if (data.points !== undefined) {
          setPoints(data.points);
        }
      })
      .catch((err) => console.error("Error updating streak:", err));

    // Fetch leaderboard data
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data);
      })
      .catch((err) => console.error("Error fetching leaderboard:", err));

    // Set initial selected date and fetch schedules
    setSelectedDate(today);
    fetch(`/api/schedules?date=${today}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSchedule(data);
        } else {
          console.error("Invalid data format:", data);
          setSchedule([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setSchedule([]);
      });
  }, [today]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8 transition-colors">
      {/* Navbar */}
      <div className="px-7 pt-6">
        <Navbar />
      </div>

      {/* Greeting + Search */}
      <div className="px-7 pt-4">
        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              Hello <span className="text-foreground">"{userName}"</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {schedule.length === 0
                ? "You have no activities today"
                : `You have ${schedule.length} activities today`}
            </p>
            {/* Streak and Points Display */}
            <div className="mt-3 flex gap-3">
              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-4 py-2 shadow-md">
                <span className="text-lg">🔥</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
                    Streak
                  </span>
                  <span className="text-lg font-bold text-white">
                    {streak} day{streak !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-2 shadow-md">
                <span className="text-lg">⭐</span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wide">
                    Points
                  </span>
                  <span className="text-lg font-bold text-white">{points}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="px-7 pb-8 pt-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* LEFT + CENTER */}
          <div className="flex-1 white">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
              {/* LEFT: Schedule */}
              <Schedule />

              {/* CENTER: Cards */}
              <div className="space-y-6">
                {/* Report */}
                <Report />

                {/* Categories */}
                <section className="rounded-[28px] bg-card p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-card-foreground">
                        Categories
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Choose your category
                      </div>
                    </div>
                    <button className="grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-accent">
                      ⋯
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {[
                      {
                        name: "Meal",
                        icon: <Utensils />,
                        color: "bg-orange-50 dark:bg-orange-950/30",
                      },
                      {
                        name: "Grocery",
                        icon: <Apple />,
                        color: "bg-green-50 dark:bg-green-950/30",
                      },
                      {
                        name: "Map",
                        icon: <Map />,
                        color: "bg-blue-50 dark:bg-blue-950/30",
                      },
                      {
                        name: "Workout",
                        icon: <Dumbbell />,
                        color: "bg-purple-50 dark:bg-purple-950/30",
                      },
                    ].map((category) => (
                      <a
                        key={category.name}
                        href={`/${category.name.toLowerCase()}`}
                        className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${category.color}`}
                        >
                          {category.icon}
                        </div>
                        <div className="text-xs font-medium text-foreground">
                          {category.name}
                        </div>
                      </a>
                    ))}
                  </div>
                </section>

                {/* Special for you */}
                <section className="rounded-[28px] bg-card p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-card-foreground">
                        Special for you
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Recommended based on your interests
                      </div>
                    </div>
                    <button className="grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-accent">
                      ⋯
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {[
                      {
                        title: "Avocado Toast with Poached Egg",
                        time: "15 min",
                        calories: "320 kcal",
                        color: "bg-orange-50 dark:bg-orange-950/30",
                      },
                      {
                        title: "Grilled Chicken Salad",
                        time: "25 min",
                        calories: "450 kcal",
                        color: "bg-green-50 dark:bg-green-950/30",
                      },
                    ].map((recipe, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 rounded-2xl bg-secondary p-3 shadow-sm ring-1 ring-border"
                      >
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-xl text-2xl ${recipe.color}`}
                        >
                          🥗
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">
                            {recipe.title}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {recipe.time} • {recipe.calories}
                          </div>
                        </div>
                        <button className="grid h-8 w-8 place-items-center rounded-full bg-accent hover:bg-accent/80">
                          ➜
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* RIGHT: Leaderboard & Friends */}
          <div className="space-y-6 lg:w-[280px]">
            {/* Leaderboard */}
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
