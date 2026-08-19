import mongoose from "mongoose";
import dotenv from "dotenv";
import { join } from "path";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User.js";
import { Organization } from "../src/models/Organization.js";

dotenv.config({ path: join(process.cwd(), ".env") });

const usersToSeed = [
  {
    email: "hod.comp@mitaoe.ac.in",
    name: "Computer Dept HOD",
    role: "hod",
    department: "Computer Engg",
    phone: "+91 9999900001"
  },
  {
    email: "workshop.hod@mitaoe.ac.in",
    name: "Workshop HOD",
    role: "workshop_hod",
    department: "Workshop",
    phone: "+91 9999900002"
  },
  {
    email: "budget.hod@mitaoe.ac.in",
    name: "Budget HOD",
    role: "budget_hod",
    department: "Finance",
    phone: "+91 9999900003"
  },
  {
    email: "registrar@mitaoe.ac.in",
    name: "Registrar",
    role: "registrar",
    department: "Administration",
    phone: "+91 9999900004"
  },
  {
    email: "director@mitaoe.ac.in",
    name: "Director",
    role: "director",
    department: "Directorate",
    phone: "+91 9999900005"
  }
];

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(mongoUri, { dbName: "mitaoe_unified_erp" });
  console.log("Connected to MongoDB.");

  const org = await Organization.findOne({ name: "MIT Academy of Engineering" });
  if (!org) {
    console.error("MIT Academy of Engineering organization not found!");
    process.exit(1);
  }
  
  if (!org.code || org.code !== "mit-aoe") {
    await Organization.updateOne({ _id: org._id }, { $set: { code: "mit-aoe" } });
    console.log("Updated organization code to mit-aoe.");
  }
  
  const passwordHash = await bcrypt.hash("password123", 10);

  for (const u of usersToSeed) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`User ${u.email} already exists.`);
      continue;
    }
    await User.create({
      ...u,
      organizationId: org._id,
      passwordHash
    });
    console.log(`Created user: ${u.email}`);
  }

  await mongoose.disconnect();
  console.log("Seeding complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
