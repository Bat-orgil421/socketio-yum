import { prisma } from "../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, calories, mealType, cuisine, image, price } =
      await request.json();

    if (!name || !calories || !mealType || !image || price === undefined) {
      return NextResponse.json(
        {
          error:
            "name, calories, mealType, image, and price are required fields",
        },
        { status: 400 },
      );
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice)) {
      return NextResponse.json(
        { error: "price must be a valid number" },
        { status: 400 },
      );
    }

    const mealTypeRecord = await prisma.mealType.findUnique({
      where: { name: mealType },
    });

    if (!mealTypeRecord) {
      return NextResponse.json(
        { error: "mealType not found" },
        { status: 400 },
      );
    }

    let cuisineRecord = null;
    if (cuisine) {
      cuisineRecord = await prisma.cuisine.findUnique({
        where: { name: cuisine },
      });

      if (!cuisineRecord) {
        return NextResponse.json(
          { error: "cuisine not found" },
          { status: 400 },
        );
      }
    }

    const food = await prisma.food.create({
      data: {
        name,
        calories,
        image,
        price: parsedPrice,
        mealTypeId: mealTypeRecord.id,
        cuisineId: cuisineRecord?.id ?? null,
      },
      include: {
        mealType: true,
        cuisine: true,
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("Error creating food:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mealTypeName = searchParams.get("mealType");
  const cuisineName = searchParams.get("cuisine");

  if (!mealTypeName && !cuisineName) {
    return NextResponse.json(
      { error: "mealType or cuisine query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const whereClause: any = {};
    if (mealTypeName) {
      whereClause.mealType = { name: mealTypeName };
    }
    if (cuisineName) {
      whereClause.cuisine = { name: cuisineName };
    }

    const foods = await prisma.food.findMany({
      where: whereClause,
      include: {
        mealType: true,
        cuisine: true,
      },
    });

    return NextResponse.json(foods);
  } catch (error) {
    console.error("Error fetching foods:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
