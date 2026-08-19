import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";
import { Organization } from "../src/models/Organization.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }
  await mongoose.connect(mongoUri, { dbName: "mitaoe_unified_erp" });
  console.log("MongoDB connected");
};

const verifyOrganization = async () => {
  try {
    await connectDB();

    console.log("\n=== Checking all organizations ===");
    const allOrgs = await Organization.find({}).lean();
    console.log(`Total organizations in database: ${allOrgs.length}`);

    allOrgs.forEach(org => {
      console.log(`\n- ${org.name} (${org.code})`);
      console.log(`  Active: ${org.isActive}`);
      console.log(`  ID: ${org._id}`);
    });

    console.log("\n=== Checking active organizations ===");
    const activeOrgs = await Organization.find({ isActive: true }).lean();
    console.log(`Active organizations: ${activeOrgs.length}`);

    activeOrgs.forEach(org => {
      console.log(`\n- ${org.name} (${org.code})`);
    });

    const mitAoe = await Organization.findOne({ code: "mit-aoe" }).lean();
    if (mitAoe) {
      console.log("\n=== MIT-AOE Details ===");
      console.log(JSON.stringify(mitAoe, null, 2));
    } else {
      console.log("\nMIT-AOE not found in database!");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await mongoose.disconnect().catch(() => { });
    process.exit(1);
  }
};

verifyOrganization();

