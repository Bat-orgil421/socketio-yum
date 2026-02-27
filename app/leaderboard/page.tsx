"use client";

import { useState, useEffect } from "react";
import Navbar from "../navbar/navber";
import { TbRosetteNumber1, TbRosetteNumber2, TbRosetteNumber3 } from "react-icons/tb";
import Snowfall from "react-snowfall";

type LeaderboardUser = {
  id: number;
  name: string;
  email: string;
  points: number;
  streak: number;
  rank: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setLeaderboard(data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-amber-500";
    if (rank === 2) return "from-gray-300 to-gray-400";
    if (rank === 3) return "from-orange-300 to-orange-400";
    return "from-zinc-400 to-zinc-500";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TbRosetteNumber1 size={28}/>;
    if (rank === 2) return <TbRosetteNumber2 size={28} />;
    if (rank === 3) return <TbRosetteNumber3 size={28} />;
    return rank;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-8 text-black dark:text-white transition-colors">
      {/* Navbar */}
      <div className="px-7 pt-6">
        <Navbar />
      </div>
      <Snowfall />
      <div className="px-7 pt-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              🏆 Leaderboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              All users ranked by points
            </p>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            Loading leaderboard...
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all hover:scale-[1.02] ${
                  user.rank === 1
                    ? "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 shadow-lg"
                    : user.rank === 2
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
                    : user.rank === 3
                    ? "bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {/* Rank */}
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(
                    user.rank,
                  )} flex items-center justify-center text-white font-bold text-lg shadow-md`}
                >
                  {getRankIcon(user.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      🔥 {user.streak} day{user.streak !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {user.points}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      points
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                No users on the leaderboard yet. Be the first!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
