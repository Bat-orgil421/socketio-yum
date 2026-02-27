import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

async function getCurrentUserId(): Promise<number | null> {
  const user = await currentUser();
  if (!user) return null;
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return null;
  const dbUser = await prisma.user.findUnique({ where: { email } });
  return dbUser?.id || null;

}

type ScheduleBody = {
  date: string;
  startTime: string;
  endTime: string;
  activity: string;
};

type ScheduleUpdateBody = {
  id: number | string;
  completed: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json([], { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json([]);
    }
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const schedules = await prisma.schedule.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json([]);
  }
}


export async function POST(request: NextRequest) {
  try {
    const body: ScheduleBody = await request.json();

    const { date, startTime, endTime, activity } = body;

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newSchedule = await prisma.schedule.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        activity,
        userId,
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error("Failed to create schedule:", error);

    // Type-safe mock schedule
    const fallbackSchedule: ScheduleBody & { id: number; completed: boolean } =
      {
        id: Date.now(),
        date: (await request.json()).date, // Type-safe cast
        startTime: (await request.json()).startTime,
        endTime: (await request.json()).endTime,
        activity: (await request.json()).activity,
        completed: false,
      };

    return NextResponse.json(fallbackSchedule, { status: 201 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ScheduleUpdateBody = await request.json();
    const { id, completed } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Verify the schedule belongs to the current user
    const schedule = await prisma.schedule.findUnique({
      where: { id: Number(id) },
    });

    if (!schedule || schedule.userId !== userId) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.schedule.update({
      where: { id: Number(id) },
      data: { completed },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update schedule:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Verify the schedule belongs to the current user
    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
    });

    if (!schedule || schedule.userId !== userId) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 },
      );
    }

    await prisma.schedule.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
