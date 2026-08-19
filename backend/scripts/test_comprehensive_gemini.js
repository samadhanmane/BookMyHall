import mongoose from "mongoose";
import dotenv from "dotenv";
import { join } from "path";
import { processChat } from "../src/services/geminiChatbotService.js";

// Load .env
dotenv.config({ path: join(process.cwd(), ".env") });

async function runTestCase(label, reqUser, queryText) {
  console.log(`\n========================================`);
  console.log(`TEST CASE: ${label}`);
  console.log(`User: ${reqUser.email} (Role: ${reqUser.role}, Dept: ${reqUser.department || "General"})`);
  console.log(`Query: "${queryText}"`);
  console.log(`========================================`);

  const body = {
    messages: [
      { role: "user", content: queryText }
    ],
    orgId: reqUser.organizationId
  };

  try {
    const result = await processChat({ reqUser, body });
    console.log("REPLY:\n" + result.reply);
    console.log("\nMeta:");
    console.log(`- Tools Used: ${JSON.stringify(result.meta?.toolsUsed || [])}`);
    console.log(`- Allowed Tools: ${JSON.stringify(result.meta?.allowedTools || [])}`);
  } catch (err) {
    console.error(`Execution error:`, err.message);
  }
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { dbName: "mitaoe_unified_erp" });
  console.log("Connected to MongoDB.");

  // Fetch some sample data from the database to prove live connection
  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  
  const OrganizationSchema = new mongoose.Schema({}, { strict: false });
  const Organization = mongoose.models.Organization || mongoose.model("Organization", OrganizationSchema);

  const UtilitySchema = new mongoose.Schema({}, { strict: false });
  const Utility = mongoose.models.Utility || mongoose.model("Utility", UtilitySchema);

  const userCount = await User.countDocuments();
  const orgCount = await Organization.countDocuments();
  const utilityCount = await Utility.countDocuments();

  console.log("\n--- LIVE DATABASE STATISTICS ---");
  console.log(`- Total Users in DB: ${userCount}`);
  console.log(`- Total Organizations in DB: ${orgCount}`);
  console.log(`- Total Facilities/Utilities in DB: ${utilityCount}`);
  
  if (utilityCount > 0) {
    const sampleUtilities = await Utility.find({}, "name categoryName").limit(3);
    console.log("- Sample Facilities in DB:");
    sampleUtilities.forEach(u => console.log(`  * ${u.name} (Category: ${u.get("categoryName") || "N/A"})`));
  }
  console.log("--------------------------------\n");

  const dbUsers = await User.find({}).limit(10);
  
  const getMockOrDbUser = (role) => {
    const found = dbUsers.find(u => u.role === role);
    if (found) {
      return {
        sub: String(found._id),
        email: found.email,
        role: found.role,
        department: found.department,
        organizationId: found.organizationId ? String(found.organizationId) : undefined
      };
    }
    // Fallback if role doesn't exist
    return {
      sub: "60a123456789012345678901",
      email: `${role}@mitaoe.ac.in`,
      role: role,
      department: "Computer Science",
      organizationId: dbUsers[0]?.organizationId ? String(dbUsers[0].organizationId) : "60a123456789012345678900"
    };
  };

  const adminUser = getMockOrDbUser("org_admin");
  const facultyUser = getMockOrDbUser("faculty");
  const hodUser = getMockOrDbUser("hod");
  const workshopHodUser = getMockOrDbUser("workshop_hod");

  // 1. Brand Identity Test
  await runTestCase("Brand Identity check", facultyUser, "who are you?");

  // 2. Canteen Menu Test (Allowed for Faculty)
  await runTestCase("Faculty checking canteen menu", facultyUser, "show canteen menu");

  // 3. Unauthorized Canteen Ordering Test (Faculty CANNOT order canteen items directly)
  await runTestCase(
    "Faculty attempting to order canteen items (Unauthorized action check)",
    facultyUser,
    "order 2 pizzas to CS department"
  );

  // 4. Authorized Canteen Ordering Test (Admin/HOD CAN order)
  await runTestCase(
    "Admin placing a canteen order",
    adminUser,
    "place canteen order for sandwich"
  );

  // 5. Booking Availability Test
  await runTestCase("Check utility availability", facultyUser, "is Seminar Hall available tomorrow?");

  // 6. Raising Maintenance Ticket Test
  await runTestCase(
    "Raising maintenance ticket",
    facultyUser,
    "raise maintenance: AC remote is missing in Room 204, Ground Floor"
  );

  // 7. Workshop HOD Approvals check
  await runTestCase(
    "Workshop HOD viewing pending tickets",
    workshopHodUser,
    "show my pending maintenance tickets"
  );

  // 8. Negative / Security Guardrail Test
  await runTestCase(
    "Negative Query - Off topic query check",
    facultyUser,
    "how do I code a binary search tree in Python?"
  );

  // 9. Live Database Booking Analytics checks (checking most booked / underutilized / department preferred)
  await runTestCase(
    "Admin checking which facility is booked most",
    adminUser,
    "which utility is booked most?"
  );

  await runTestCase(
    "Admin checking underutilized facilities",
    adminUser,
    "what are the underutilized facilities?"
  );

  await runTestCase(
    "Faculty checking department preferred facility",
    facultyUser,
    "what is the most used facility by my department?"
  );

  await runTestCase(
    "Admin checking which category is booked most",
    adminUser,
    "which is main category for utilities which is booked most"
  );

  const directorUser = getMockOrDbUser("director");
  await runTestCase(
    "Director checking campus utilization report",
    directorUser,
    "campus utilization report"
  );

  await runTestCase(
    "Director checking monthly operations summary",
    directorUser,
    "monthly operations summary"
  );

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
