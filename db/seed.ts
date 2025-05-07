import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { sql } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// Function to hash password
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting seed process...");
    
    // Check if any users exist
    const existingUsers = await db.select().from(schema.users);
    if (existingUsers.length > 0) {
      console.log("Database already has users, skipping seed");
      return;
    }
    
    // Add admin user
    const adminPassword = await hashPassword("admin123");
    const [admin] = await db.insert(schema.users).values({
      username: "admin",
      password: adminPassword,
      fullName: "Admin User",
      email: "admin@campusvote.edu",
      role: "admin",
    }).returning();
    
    console.log("Admin user created:", admin.username);
    
    // Add some sample student IDs for registration
    const departments = ["Computer Science", "Engineering", "Business", "Arts & Humanities", "Science"];
    const studentIds = [
      { studentId: "S1012345", department: "Computer Science" },
      { studentId: "S1023456", department: "Business" },
      { studentId: "S1034567", department: "Engineering" },
      { studentId: "S1045678", department: "Arts & Humanities" },
      { studentId: "S1056789", department: "Science" },
    ];
    
    const insertedStudents = await db.insert(schema.students)
      .values(studentIds)
      .returning();
    
    console.log("Sample student IDs created:", insertedStudents.length);
    
    // Add positions
    const positions = [
      { name: "President", description: "Student body president" },
      { name: "Vice President", description: "Student body vice president" },
      { name: "Secretary", description: "Student body secretary" },
      { name: "Treasurer", description: "Student body treasurer" },
    ];
    
    const insertedPositions = await db.insert(schema.positions)
      .values(positions)
      .returning();
    
    console.log("Positions created:", insertedPositions.length);
    
    // Create a student user for testing
    const studentPassword = await hashPassword("student123");
    const [student] = await db.insert(schema.users).values({
      username: "S1012345",
      password: studentPassword,
      fullName: "John Smith",
      email: "jsmith@student.edu",
      role: "student",
      department: "Computer Science"
    }).returning();
    
    // Update the student record to mark as registered
    await db.update(schema.students)
      .set({ isRegistered: true, userId: student.id })
      .where(sql`student_id = 'S1012345'`);
    
    console.log("Student user created:", student.username);
    
    // Add candidates
    const presidentPosition = insertedPositions.find(p => p.name === "President");
    const vpPosition = insertedPositions.find(p => p.name === "Vice President");
    const secretaryPosition = insertedPositions.find(p => p.name === "Secretary");
    const treasurerPosition = insertedPositions.find(p => p.name === "Treasurer");
    
    if (presidentPosition && vpPosition && secretaryPosition && treasurerPosition) {
      const candidates = [
        // President candidates
        {
          name: "Alex Johnson",
          department: "Computer Science",
          year: "Senior",
          positionId: presidentPosition.id,
          bio: "Computer science major with leadership experience",
          platform: "Improve campus technology and student services"
        },
        {
          name: "Morgan Williams",
          department: "Business",
          year: "Junior",
          positionId: presidentPosition.id,
          bio: "Business major with strong organizational skills",
          platform: "Enhance student activities and career opportunities"
        },
        {
          name: "Taylor Smith",
          department: "Political Science",
          year: "Senior",
          positionId: presidentPosition.id,
          bio: "Political science student with a passion for advocacy",
          platform: "Advocate for student rights and campus improvements"
        },
        {
          name: "Jordan Lee",
          department: "Engineering",
          year: "Junior",
          positionId: presidentPosition.id,
          bio: "Engineering student with innovative ideas",
          platform: "Implement sustainable campus initiatives"
        },
        
        // VP candidates
        {
          name: "Sarah Johnson",
          department: "Business Administration",
          year: "Junior",
          positionId: vpPosition.id,
          bio: "Business administration student with leadership experience",
          platform: "Enhance student services, create more study spaces, organize networking events"
        },
        {
          name: "Robert Chen",
          department: "Computer Science",
          year: "Senior",
          positionId: vpPosition.id,
          bio: "Computer science major with technical expertise",
          platform: "Improve technology resources, advocate for extended library hours, expand research opportunities"
        },
        {
          name: "Maria Garcia",
          department: "Political Science",
          year: "Junior",
          positionId: vpPosition.id,
          bio: "Political science student focused on inclusion",
          platform: "Foster diversity and inclusion, establish student mentorship program, improve campus sustainability"
        },
        
        // Secretary candidates
        {
          name: "David Kim",
          department: "Communications",
          year: "Junior",
          positionId: secretaryPosition.id,
          bio: "Communications major with excellent writing skills",
          platform: "Improve transparency and communication between student government and the student body"
        },
        {
          name: "Emily Rodriguez",
          department: "English",
          year: "Senior",
          positionId: secretaryPosition.id,
          bio: "English major with attention to detail",
          platform: "Maintain accurate records and enhance information accessibility"
        },
        {
          name: "Michael Brown",
          department: "History",
          year: "Junior",
          positionId: secretaryPosition.id,
          bio: "History student with organizational skills",
          platform: "Streamline administrative processes and improve documentation"
        },
        
        // Treasurer candidates
        {
          name: "Jennifer Patel",
          department: "Finance",
          year: "Senior",
          positionId: treasurerPosition.id,
          bio: "Finance major with accounting experience",
          platform: "Ensure responsible budget management and financial transparency"
        },
        {
          name: "Christopher Wilson",
          department: "Economics",
          year: "Junior",
          positionId: treasurerPosition.id,
          bio: "Economics student with analytical skills",
          platform: "Allocate funds efficiently to benefit the entire student body"
        }
      ];
      
      const insertedCandidates = await db.insert(schema.candidates)
        .values(candidates)
        .returning();
      
      console.log("Candidates created:", insertedCandidates.length);
    }
    
    // Create initial activity log
    await db.insert(schema.activityLogs).values({
      userId: admin.id,
      action: "System Initialization",
      details: "Database seeded with initial data",
    });
    
    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error during seed process:", error);
  }
}

seed();
