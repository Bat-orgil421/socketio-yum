import { prisma } from "../lib/prisma";

async function main() {
  // Create meal types
  const breakfast = await prisma.mealType.upsert({
    where: { name: "breakfast" },
    update: {},
    create: { name: "breakfast" },
  });

  const lunch = await prisma.mealType.upsert({
    where: { name: "lunch" },
    update: {},
    create: { name: "lunch" },
  });

  // Create cuisines
  const italian = await prisma.cuisine.upsert({
    where: { name: "Italian" },
    update: {},
    create: { name: "Italian" },
  });

  const chinese = await prisma.cuisine.upsert({
    where: { name: "Chinese" },
    update: {},
    create: { name: "Chinese" },
  });

  // Create foods
  await prisma.food.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "egg",
      mealTypeId: breakfast.id,
      cuisineId: italian.id,
      image: "https://via.placeholder.com/150",
      calories: "100",
      price: 5.0,
    },
  });

  await prisma.food.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "bread",
      mealTypeId: breakfast.id,
      cuisineId: chinese.id,
      image: "https://via.placeholder.com/150",
      calories: "200",
      price: 3.0,
    },
  });

  await prisma.food.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "sandwich",
      mealTypeId: lunch.id,
      cuisineId: italian.id,
      image: "https://via.placeholder.com/150",
      calories: "300",
      price: 7.0,
    },
  });

  await prisma.food.upsert({
    where: { id: 4 },
    update: {},
    create: {
      name: "salad",
      mealTypeId: lunch.id,
      cuisineId: chinese.id,
      image: "https://via.placeholder.com/150",
      calories: "150",
      price: 6.0,
    },
  });

  // Create grocery items
  await prisma.groceryItem.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Milk",
      unit: "liter",
      calPerUnit: "600",
      image: "https://via.placeholder.com/150",
      price: 2.5,
    },
  });

  await prisma.groceryItem.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Bread",
      unit: "loaf",
      calPerUnit: "250",
      image: "https://via.placeholder.com/150",
      price: 1.8,
    },
  });

  await prisma.groceryItem.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: "Eggs",
      unit: "dozen",
      calPerUnit: "840",
      image: "https://via.placeholder.com/150",
      price: 3.0,
    },
  });

  console.log("Seeded database");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });