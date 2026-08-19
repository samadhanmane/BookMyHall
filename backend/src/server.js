import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import { Booking } from "./models/Booking.js";

const start = async () => {
  try {
    await connectDB();

    // Log MongoDB connection lifecycle events
    mongoose.connection.on("disconnected", () =>
      console.warn("[MongoDB] Disconnected from Atlas — driver will auto-reconnect")
    );
    mongoose.connection.on("reconnected", () =>
      console.log("[MongoDB] Reconnected to Atlas successfully")
    );
    mongoose.connection.on("error", (err) =>
      console.error("[MongoDB] Connection error:", err.message)
    );

    const app = createApp();
    const server = app.listen(env.PORT, () => {
      console.log(`Backend API listening on port ${env.PORT}`);
    });
    server.on("error", (err) => {
      console.error("Server failed to start:", err);
      process.exit(1);
    });

    /**
     * Lock Cleanup — runs every 60s to delete expired LOCKED bookings.
     * Resilient to transient MongoDB network errors (ECONNRESET, Atlas idle resets).
     */
    const runLockCleanup = async (isRetry = false) => {
      // Only run if Mongoose is fully connected (state 1 = connected)
      if (mongoose.connection.readyState !== 1) {
        console.warn("[Lock Cleanup] Skipped — MongoDB not connected (readyState:", mongoose.connection.readyState, ")");
        return;
      }

      try {
        const deleted = await Booking.deleteMany({
          status: "LOCKED",
          lockExpiresAt: { $lt: new Date() }
        });
        if (deleted.deletedCount > 0) {
          console.log(`[Lock Cleanup] Cleaned up ${deleted.deletedCount} expired booking lock(s).`);
        }
      } catch (err) {
        const isTransient =
          err.name === "MongoNetworkError" ||
          err.name === "MongoNetworkTimeoutError" ||
          err.code === "ECONNRESET" ||
          err.code === "ENOTFOUND" ||
          err.message?.includes("topology") ||
          err.message?.includes("pool") ||
          err.message?.includes("ECONNRESET");

        if (isTransient && !isRetry) {
          // Retry once after 3 seconds on transient network blip
          console.warn("[Lock Cleanup] Transient network error — will retry in 3s:", err.message);
          setTimeout(() => runLockCleanup(true), 3000);
        } else if (isTransient) {
          // Second failure — log quietly and skip this cycle
          console.warn("[Lock Cleanup] Retry also failed (transient) — skipping this cycle:", err.message);
        } else {
          // Real unexpected error — log fully
          console.error("[Lock Cleanup] Unexpected error cleaning up expired locks:", err);
        }
      }
    };

    const cleanupInterval = setInterval(() => { void runLockCleanup(); }, 60000);


    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      clearInterval(cleanupInterval);
      server.close(async (closeErr) => {
        if (closeErr) {
          console.error("Error while closing HTTP server:", closeErr);
          process.exit(1);
        }
        try {
          await mongoose.connection.close(false);
          console.log("MongoDB connection closed.");
          process.exit(0);
        } catch (dbErr) {
          console.error("Error while closing MongoDB connection:", dbErr);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => {
      void gracefulShutdown("SIGTERM");
    });
    process.on("SIGINT", () => {
      void gracefulShutdown("SIGINT");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();
// Trigger restart


