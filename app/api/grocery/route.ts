import { prisma } from "../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { name, unit, calPerUnit, image, price } = await request.json();

    if (!name || !unit || !calPerUnit || price === undefined) {
      return NextResponse.json(
        { error: "name, unit, calPerUnit, and price are required fields" },
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

    const groceryItem = await prisma.groceryItem.create({
      data: {
        name,
        unit,
        calPerUnit,
        image: image || null,
        price: parsedPrice,
      },
    });

    return NextResponse.json(groceryItem, { status: 201 });
  } catch (error) {
    console.error("Error creating grocery item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const groceryItems = await prisma.groceryItem.findMany();

    return NextResponse.json(groceryItems);
  } catch (error) {
    console.error("Error fetching grocery items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
