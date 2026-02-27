import { prisma } from "../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cuisines: { name: string }[] = await prisma.cuisine.findMany({
      select: { name: true },
    });

    return NextResponse.json(cuisines.map((c) => c.name));
  } catch (error) {
    console.error("Error fetching cuisines:", error);
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
        { error: "Cuisine name is required" },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();

    console.log("Creating cuisine:", trimmedName);

    // Use upsert to handle race conditions and unique constraints
    const cuisine = await prisma.cuisine.upsert({
      where: { name: trimmedName },
      update: {},
      create: { name: trimmedName },
    });

    console.log("Cuisine created:", cuisine);

    return NextResponse.json(cuisine, { status: 201 });
  } catch (error) {
    console.error("Error creating cuisine:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
