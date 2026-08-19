import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";
import { Organization } from "../src/models/Organization.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, "..", ".env") });

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }
  await mongoose.connect(mongoUri, { dbName: "mitaoe_unified_erp" });
  console.log("MongoDB connected");
};

const addOrganization = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    const orgData = {
      name: "MIT Academy of Engineering",
      code: "mit-aoe",
      address: "Alandi, Pune, Maharashtra 412105",
      contactEmail: "admin@mitaoe.ac.in",
      contactPhone: "+91 20 3069 1000",
      isActive: true,
    };

    console.log(`Checking if organization with code "${orgData.code}" exists...`);
    // Check if organization already exists
    const existing = await Organization.findOne({ code: orgData.code });
    if (existing) {
      console.log(`✓ Organization with code "${orgData.code}" already exists.`);
      console.log("Existing organization:", {
        name: existing.name,
        code: existing.code,
        isActive: existing.isActive
      });
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log("Creating organization...");
    const org = await Organization.create(orgData);
    console.log("✓ Organization created successfully!");
    console.log("Details:", {
      name: org.name,
      code: org.code,
      address: org.address,
      contactEmail: org.contactEmail,
      isActive: org.isActive
    });

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("✗ Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

addOrganization();

