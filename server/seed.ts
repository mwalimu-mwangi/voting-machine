import { db } from "./db";
import { users, UserRole } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Check if admin exists
    const existingAdmins = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (existingAdmins.length > 0) {
      console.log("Admin user already exists");
    } else {
      // Create admin user
      const hashedPassword = await hashPassword("password");
      
      const [admin] = await db.insert(users).values({
        username: "admin",
        password: hashedPassword,
        firstName: "System",
        lastName: "Administrator",
        email: "admin@example.com",
        role: UserRole.ADMIN
      }).returning();
      
      console.log("Admin user created:", admin);
    }

    // Add other seed data here if needed
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();