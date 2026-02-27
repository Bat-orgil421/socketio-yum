import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
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

    // Find the user in the database
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user's health profile
    const healthProfile = await prisma.userHealthProfile.findUnique({
      where: { userId: dbUser.id },
    });

    if (!healthProfile) {
      return NextResponse.json(
        { error: "Health profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(healthProfile);
  } catch (error) {
    console.error("Error fetching health profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch health profile" },
      { status: 500 },
    );
  }
}
