import mongoose from "mongoose";
import dotenv from "dotenv";
import { join } from "path";
import bcrypt from "bcryptjs";
import fs from "fs";
import { User } from "../src/models/User.js";
import { Organization } from "../src/models/Organization.js";

dotenv.config({ path: join(process.cwd(), ".env") });

const ORG_ID = "6a6f4f96c19855009412158f";
const DB_NAME = "final_hall_test";
const DEFAULT_PASSWORD = "123456";

const demoUsers = [

  {
    name: "Director",
    email: "test.director@test.local",
    role: "director",
    organizationId: ORG_ID,
    department: "Directorate",
    phone: "+919999900002"
  },
  {
    name: "Registrar",
    email: "test.registrar@test.local",
    role: "registrar",
    organizationId: ORG_ID,
    department: "Administration",
    phone: "+919999900003"
  },
  {
    name: "Computer Dept HOD",
    email: "test.hod@test.local",
    role: "hod",
    organizationId: ORG_ID,
    department: "Computer Engg",
    phone: "+919999900004"
  },
  {
    name: "Lab Coordinator",
    email: "test.coord@test.local",
    role: "coordinator",
    organizationId: ORG_ID,
    department: "Computer Engg",
    phone: "+919999900005"
  },
  {
    name: "Updated Faculty Name",
    email: "faculty.new@test.local",
    role: "faculty",
    organizationId: ORG_ID,
    department: "Computer Engg",
    phone: "+919999988888"
  },
  {
    name: "Canteen Assistant",
    email: "test.assistant@test.local",
    role: "assistant",
    organizationId: ORG_ID,
    department: "Canteen",
    phone: "+918888877777"
  },
  {
    name: "Workshop HOD",
    email: "test.workshophod@test.local",
    role: "workshop_hod",
    organizationId: ORG_ID,
    department: "Workshop",
    phone: "+918888877777"
  },
  {
    name: "Technician Worker",
    email: "test.worker@test.local",
    role: "worker",
    organizationId: ORG_ID,
    department: "Workshop",
    phone: "+919999999999"
  },
  {
    name: "Canteen Owner",
    email: "test.canteenowner@test.local",
    role: "canteen_owner",
    organizationId: ORG_ID,
    department: "Canteen",
    phone: "+918888877777"
  }
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is not set in backend/.env");
    process.exit(1);
  }

  console.log(`Connecting to MongoDB database: ${DB_NAME}...`);
  await mongoose.connect(mongoUri, {
    dbName: DB_NAME,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 10000
  });

  console.log("Connected successfully to MongoDB.");

  // Check if organization exists, if not create/ensure it
  let org = await Organization.findById(ORG_ID);
  if (!org) {
    console.log(`Organization ${ORG_ID} not found by ID, checking or creating...`);
    org = await Organization.create({
      _id: new mongoose.Types.ObjectId(ORG_ID),
      name: "MIT Academy of Engineering",
      code: "mitaoe",
      isActive: true
    });
    console.log(`Created organization: ${org.name} (${org._id})`);
  } else {
    console.log(`Found organization: ${org.name} (${org._id})`);
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log(`Generated passwordHash for default password "${DEFAULT_PASSWORD}".`);

  const importList = [];

  for (const user of demoUsers) {
    const orgObjId = user.organizationId ? new mongoose.Types.ObjectId(user.organizationId) : null;
    
    const updatedUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: orgObjId,
          department: user.department,
          phone: user.phone,
          passwordHash: passwordHash
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✓ Seeded user: ${user.email} (${user.role}) - ID: ${updatedUser._id}`);

    importList.push({
      _id: { "$oid": updatedUser._id.toString() },
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? { "$oid": user.organizationId } : null,
      department: user.department,
      phone: user.phone,
      passwordHash: passwordHash,
      createdAt: { "$date": new Date().toISOString() },
      updatedAt: { "$date": new Date().toISOString() },
      __v: 0
    });
  }

  // Export JSON file for MongoDB Compass import
  const jsonPath = join(process.cwd(), "demo_users_import.json");
  fs.writeFileSync(jsonPath, JSON.stringify(importList, null, 2), "utf8");
  console.log(`\nExported MongoDB import JSON to: ${jsonPath}`);

  await mongoose.disconnect();
  console.log("Database connection closed. All demo users ready!");
}

seed().catch((err) => {
  console.error("Error seeding users:", err);
  process.exit(1);
});
