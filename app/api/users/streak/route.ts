import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 400 });
    }

    // Get current user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    let newStreak = dbUser.streak || 0;
    let newPoints = dbUser.points || 0;
    let newStreakStartDate = dbUser.streakStartDate;
    const newLastLoginDate = today;

    // Check if user has logged in today
    if (dbUser.lastLoginDate) {
      const lastLogin = new Date(dbUser.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // If last login was today, don't update streak or points
      if (lastLogin.getTime() === today.getTime()) {
        return NextResponse.json({
          streak: newStreak,
          points: newPoints,
          streakStartDate: newStreakStartDate,
          lastLoginDate: dbUser.lastLoginDate,
          message: "Already logged in today",
        });
      }

      // If last login was yesterday, increment streak
      if (lastLogin.getTime() === yesterday.getTime()) {
        newStreak += 1;
        newPoints += 10; // Award 10 points for maintaining streak
      } else {
        // Streak broken, start new streak
        newStreak = 1;
        newPoints += 5; // Award 5 points for starting new streak
        newStreakStartDate = today;
      }
    } else {
      // First login ever
      newStreak = 1;
      newPoints += 10; // Award 10 points for first login
      newStreakStartDate = today;
    }

    // Update user with new streak and points
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        streak: newStreak,
        points: newPoints,
        lastLoginDate: newLastLoginDate,
        streakStartDate: newStreakStartDate,
      },
    });

    return NextResponse.json({
      streak: updatedUser.streak,
      points: updatedUser.points,
      streakStartDate: updatedUser.streakStartDate,
      lastLoginDate: updatedUser.lastLoginDate,
      message: "Streak and points updated",
    });
  } catch (error) {
    console.error("Error updating streak:", error);
    return NextResponse.json(
      { error: "Failed to update streak" },
      { status: 500 },
    );
  }
}
