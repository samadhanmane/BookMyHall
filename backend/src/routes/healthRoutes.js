import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get("/ready", (req, res) => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = mongoose.connection.readyState;
  if (state === 1) {
    return res.status(200).json({ status: "ready", db: "connected" });
  }
  return res.status(503).json({ status: "not_ready", db: "not_connected" });
});

export default router;

