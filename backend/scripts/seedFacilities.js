import dotenv from "dotenv";
import mongoose from "mongoose";
import { Hall } from "../src/models/Hall.js";

dotenv.config();

const HALLS = [
  {
    name: "Seminar Hall A",
    type: "seminar_hall",
    capacity: 60,
    location: "Block A, 2nd Floor",
    amenities: ["projector", "AC", "mic", "whiteboard"]
  },
  {
    name: "Seminar Hall B",
    type: "seminar_hall",
    capacity: 120,
    location: "Block B, 1st Floor",
    amenities: ["projector", "AC", "dual mic", "podium"]
  },
  {
    name: "Main Auditorium",
    type: "auditorium",
    capacity: 400,
    location: "Central Campus",
    amenities: ["stage", "sound system", "AC", "projector"]
  },
  {
    name: "Computer Lab 1",
    type: "lab",
    capacity: 40,
    location: "IT Block, Ground Floor",
    amenities: ["40 PCs", "AC", "projector"]
  },
  {
    name: "Computer Lab 2",
    type: "lab",
    capacity: 40,
    location: "IT Block, 1st Floor",
    amenities: ["40 PCs", "AC"]
  },
  {
    name: "Sports Complex",
    type: "sports",
    capacity: 100,
    location: "Sports Ground, West Campus",
    amenities: ["changing rooms", "equipment storage"]
  },
  {
    name: "Classroom 101",
    type: "classroom",
    capacity: 30,
    location: "Academic Block, 1st Floor",
    amenities: ["whiteboard", "projector"]
  },
  {
    name: "Conference Room",
    type: "seminar_hall",
    capacity: 20,
    location: "Admin Building, 3rd Floor",
    amenities: ["AC", "TV screen", "whiteboard"]
  }
];

async function seed() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL;

  if (!uri) {
    console.error("MONGO_URI / MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(uri);

  for (const hall of HALLS) {
    const exists = await Hall.findOne({ name: hall.name });
    if (!exists) {
      await Hall.create(hall);
      console.log(`Inserted: ${hall.name}`);
    } else {
      console.log(`Skipped (exists): ${hall.name}`);
    }
  }

  await mongoose.disconnect();
  console.log("Seeding complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
