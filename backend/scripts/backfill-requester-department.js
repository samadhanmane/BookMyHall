import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";
import { Booking } from "../src/models/Booking.js";
import { User } from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/";
  await mongoose.connect(mongoUri, { dbName: "final_hall" });
  console.log("MongoDB connected");
};

const backfillRequesterDepartment = async () => {
  try {
    await connectDB();

    console.log("\n=== Checking Bookings with missing requesterDepartment ===");
    const bookings = await Booking.find({
      $or: [
        { requesterDepartment: { $exists: false } },
        { requesterDepartment: null },
        { requesterDepartment: "" }
      ]
    });

    console.log(`Found ${bookings.length} bookings requiring department backfill.`);

    let backfilledCount = 0;
    for (const b of bookings) {
      if (!b.requesterId) {
        console.warn(`Booking ${b._id} has no requesterId! Skipping...`);
        continue;
      }
      
      const user = await User.findOne({ _id: b.requesterId });
      if (!user) {
        console.warn(`User ${b.requesterId} not found for Booking ${b._id}! Setting default department 'Other'...`);
        b.requesterDepartment = "Other";
      } else {
        b.requesterDepartment = user.department || "Other";
      }

      await b.save();
      backfilledCount++;
    }

    console.log(`Successfully backfilled ${backfilledCount} bookings.`);
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    await mongoose.disconnect().catch(() => { });
    process.exit(1);
  }
};

backfillRequesterDepartment();
