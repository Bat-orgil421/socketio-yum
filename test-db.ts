import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
console.log("Connection string:", connectionString?.substring(0, 50) + "...");

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log("Users found:", users.length);
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
