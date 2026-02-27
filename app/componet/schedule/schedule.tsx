import { useMemo, useState, useEffect } from "react";

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

export default function SchedulePage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [userName, setUserName] = useState("User");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timeAmPm, setTimeAmPm] = useState<"AM" | "PM">("AM");
  const [activity, setActivity] = useState("");
  const [leaderboard, setLeaderboard] = useState<
    Array<{ id: number; name: string; points: number; rank: number }>
  >([]);

  const dates = useMemo(() => {
    const today = new Date();
    const out: {
      key: string;
      date: string;
      day: number;
      shortDay: string;
      isToday: boolean;
    }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - 1 + i);
      out.push({
        key: d.toDateString(),
        date: d.toISOString().split("T")[0],
        day: d.getDate(),
        shortDay: d.toLocaleDateString("en", { weekday: "short" }),
        isToday: i === 1,
      });
    }
    return out;
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const fetchSchedulesForDate = (date: string) => {
    setSelectedDate(date);
    fetch(`/api/schedules?date=${date}`)
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
  };

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

  const getNowPosition = (minTime: number, maxTime: number): number => {
    const now = new Date();
    const totalMinutes =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;

    const range = maxTime - minTime;
    if (range <= 0) return 0;

    const pct = ((totalMinutes - minTime) / range) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const formatTimeWithAmPm = (time24: string) => {
    const [hours24, minutes] = time24.split(":").map(Number);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const timeRange =
    schedule.length > 0
      ? {
          min: Math.min(
            ...schedule.map((s) => {
              const [h, m] = s.startTime.split(":").map(Number);
              return h * 60 + m;
            }),
          ),
          max: Math.max(
            ...schedule.map((s) => {
              const [h, m] = s.endTime.split(":").map(Number);
              return h * 60 + m;
            }),
          ),
        }
      : { min: 0, max: 1440 };

  const formatItem = (item: ScheduleItem) => {
    return `${formatTimeWithAmPm(item.startTime)} ${item.activity}`;
  };

  const getTimeStatus = (
    item: ScheduleItem,
  ): "active" | "passed" | "future" => {
    const now = new Date();

    const [startHours, startMinutes] = item.startTime.split(":").map(Number);
    const startTimeDate = new Date();
    startTimeDate.setHours(startHours, startMinutes, 0, 0);

    const passedTime = new Date(startTimeDate.getTime() + 60000); // +1 minute

    if (now >= passedTime) return "passed";
    if (now >= startTimeDate) return "active";
    return "future";
  };

  const getItemPosition = (
    time: string,
    minTime: number,
    maxTime: number,
  ): number => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    const range = maxTime - minTime;
    if (range <= 0) return 0;

    const pct = ((totalMinutes - minTime) / range) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  return (
    <section className="rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-[0_12px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          View today's schedule
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          ✏️
        </button>
      </div>

      {/* Date pills */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
          ‹
        </button>

        <div className="flex gap-2">
          {dates.map((d) => (
            <button
              key={d.key}
              onClick={() => fetchSchedulesForDate(d.date)}
              className={[
                "flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-center transition-colors",
                selectedDate === d.date
                  ? "bg-[#FFD54A] text-emerald-700"
                  : d.isToday
                  ? "bg-lime-400"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700",
              ].join(" ")}
            >
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {d.day}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {d.shortDay}
              </div>
            </button>
          ))}
        </div>

        <button className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
          ›
        </button>
      </div>

      {/* Timeline list - Real-time timeline */}
      <div className="mt-5 relative">
        {schedule.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
            No activities for this date
          </p>
        ) : (
          <div className="relative pl-10 h-[320px]">
            {/* Constant vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-700" />

            {/* NOW marker - moves in real time */}
            <div
              className="absolute left-0 right-0 h-0.5 bg-[#FFD54A] z-20 pointer-events-none"
              style={{
                top: `${getNowPosition(timeRange.min, timeRange.max)}%`,
                transform: "translateY(-50%)",
              }}
            >
              <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FFD54A] rounded-full border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-[8px] font-bold text-emerald-700">
                  NOW
                </span>
              </div>
            </div>

            {/* Time labels on left */}
            <div className="absolute left-[-45px] top-0 bottom-0 flex flex-col justify-between py-2 text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>
                {formatTimeWithAmPm(
                  `${Math.floor(timeRange.min / 60)
                    .toString()
                    .padStart(2, "0")}:${(timeRange.min % 60)
                    .toString()
                    .padStart(2, "0")}`,
                )}
              </span>
              <span>
                {formatTimeWithAmPm(
                  `${Math.floor((timeRange.min + timeRange.max) / 2 / 60)
                    .toString()
                    .padStart(2, "0")}:${Math.floor(
                    ((timeRange.min + timeRange.max) / 2) % 60,
                  )
                    .toString()
                    .padStart(2, "0")}`,
                )}
              </span>
              <span>
                {formatTimeWithAmPm(
                  `${Math.floor(timeRange.max / 60)
                    .toString()
                    .padStart(2, "0")}:${(timeRange.max % 60)
                    .toString()
                    .padStart(2, "0")}`,
                )}
              </span>
            </div>

            {/* Schedule items positioned by time */}
            {[...schedule]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((item, idx) => {
                const status = getTimeStatus(item);
                const isCompleted = item.completed;
                const position = getItemPosition(
                  item.startTime,
                  timeRange.min,
                  timeRange.max,
                );
                const dotColor = isCompleted
                  ? "bg-stone-300 dark:bg-stone-600"
                  : status === "active"
                  ? "bg-emerald-500"
                  : status === "passed"
                  ? "bg-red-500"
                  : "bg-zinc-400 dark:bg-zinc-600";
                const textColor = isCompleted
                  ? "text-stone-300 dark:text-stone-500"
                  : status === "active"
                  ? "text-zinc-900 dark:text-zinc-100"
                  : status === "passed"
                  ? "text-red-500"
                  : "text-zinc-500 dark:text-zinc-400";
                return (
                  <div
                    key={item.id}
                    className="absolute left-0 right-0 flex items-center gap-4 group"
                    style={{
                      top: `${position}%`,
                      transform: "translateY(-50%)",
                    }}
                  >
                    {/* Colored dot on the line */}
                    <div
                      className={`absolute left-[9px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${dotColor} shadow-sm z-10`}
                    />

                    {/* Content */}
                    <div className="flex-1 ml-8">
                      <div
                        className={`text-[12px] leading-5 ${textColor} ${
                          isCompleted ? "line-through" : ""
                        }`}
                      >
                        {formatItem(item)}
                      </div>
                    </div>
                    {/* Buttons - show on hover */}
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {status !== "passed" && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/schedules", {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  id: item.id,
                                  completed: !item.completed,
                                }),
                              });
                              if (res.ok) {
                                const updated = await res.json();
                                setSchedule(
                                  schedule.map((s) =>
                                    s.id === item.id ? updated : s,
                                  ),
                                );
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`grid h-5 w-5 place-items-center rounded border transition-colors ${
                            item.completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-zinc-300 hover:border-emerald-400"
                          }`}
                        >
                          {item.completed ? "^" : ""}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `/api/schedules?id=${item.id}`,
                              {
                                method: "DELETE",
                              },
                            );
                            if (res.ok) {
                              setSchedule(
                                schedule.filter((s) => s.id !== item.id),
                              );
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Add item form */}
      {showForm && (
        <div className="mt-5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 shadow-sm transition-all duration-300 ease-in-out">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Time
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={timeHours}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setTimeHours(val);
                    if (val.length === 2 && timeMinutes.length < 2) {
                      document.getElementById("time-minutes")?.focus();
                    }
                  }}
                  placeholder="HH"
                  className="w-14 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-2 py-2 text-center text-sm outline-none focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-zinc-500 dark:text-zinc-400">:</span>
                <input
                  id="time-minutes"
                  type="text"
                  maxLength={2}
                  value={timeMinutes}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setTimeMinutes(val);
                  }}
                  placeholder="MM"
                  className="w-14 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-2 py-2 text-center text-sm outline-none focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={() => setTimeAmPm(timeAmPm === "AM" ? "PM" : "AM")}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm font-medium outline-none focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] text-zinc-900 dark:text-zinc-100"
                >
                  {timeAmPm}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Activity
              </label>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Enter activity"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm outline-none focus:border-[#7B61FF] focus:ring-1 focus:ring-[#7B61FF] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const hours = parseInt(timeHours) || 0;
                  const minutes = parseInt(timeMinutes) || 0;

                  if (
                    hours < 1 ||
                    hours > 12 ||
                    minutes < 0 ||
                    minutes > 59 ||
                    !activity
                  ) {
                    alert("Please enter valid time and activity");
                    return;
                  }

                  // Convert to 24-hour format
                  let hours24 = hours;
                  if (timeAmPm === "PM" && hours !== 12) hours24 = hours + 12;
                  if (timeAmPm === "AM" && hours === 12) hours24 = 0;

                  const startTime24 = `${hours24
                    .toString()
                    .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

                  // Calculate endTime as 1 hour after startTime
                  const endHours = (hours24 + 1) % 24;
                  const endTime24 = `${endHours
                    .toString()
                    .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

                  try {
                    const res = await fetch("/api/schedules", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        date: selectedDate || today,
                        startTime: startTime24,
                        endTime: endTime24,
                        activity,
                      }),
                    });
                    if (res.ok) {
                      const newItem = await res.json();
                      setSchedule([...schedule, newItem]);
                      setTimeHours("");
                      setTimeMinutes("");
                      setTimeAmPm("AM");
                      setActivity("");
                      setShowForm(false);
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex-1 rounded-lg bg-[#7B61FF] py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Add to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
