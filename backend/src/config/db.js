import dns from "dns";
import mongoose from "mongoose";
import { env } from "./env.js";

const DB_NAME = "final_hall";

/** Node on Windows often cannot resolve mongodb+srv via restrictive LAN DNS. */
const usePublicDnsForSrv = (uri) => {
  if (uri.startsWith("mongodb+srv://")) {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  }
};

export const connectDB = async () => {
  if (!env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in environment variables");
  }

  usePublicDnsForSrv(env.MONGO_URI);

  await mongoose.connect(env.MONGO_URI, {
    dbName: DB_NAME,
    // Keep connections alive — prevents Atlas from resetting idle TCP connections (ECONNRESET)
    socketTimeoutMS: 45000,           // Abort socket ops that hang for > 45s
    serverSelectionTimeoutMS: 10000,  // Fail fast if Atlas is unreachable (10s)
    heartbeatFrequencyMS: 10000,      // Ping replica set every 10s to keep connection warm
    maxPoolSize: 10,                  // Limit concurrent connections
    minPoolSize: 2,                   // Keep at least 2 connections open at all times
    connectTimeoutMS: 30000,          // Initial connection timeout
    family: 4,                        // Force IPv4 (avoids IPv6 DNS issues on Windows)
  });
  console.log("MongoDB connected");

  try {
    const db = mongoose.connection.db;
    await db.collection("bookings").dropIndex("organizationId_1_utilityId_1_date_1_timeSlotId_1");
    console.log("Dropped old booking unique index successfully (to support LOCKED status)");
  } catch (err) {
    // Index may not exist or already be dropped, ignore
  }
};
