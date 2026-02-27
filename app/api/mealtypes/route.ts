import { prisma } from "../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Prisma select ашиглаж зөв type тодорхойлно
    const mealTypes: { name: string }[] = await prisma.mealType.findMany({
      select: { name: true },
    });

    // map-д type тодорхой тул implicit any алдаа гарахгүй
    return NextResponse.json(mealTypes.map((mt) => mt.name));
  } catch (error) {
    console.error("Error fetching meal types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Meal type name is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    console.log("Creating meal type:", trimmedName);

    // Use upsert to handle race conditions and unique constraints
    const mealType = await prisma.mealType.upsert({
      where: { name: trimmedName },
      update: {},
      create: { name: trimmedName },
    });

    console.log("Meal type created:", mealType);

    return NextResponse.json(mealType, { status: 201 });
  } catch (error) {
    console.error("Error creating meal type:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
