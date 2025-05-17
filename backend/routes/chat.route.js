import express from "express";
import { sendChatMessage } from "../controllers/chat.controller.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  next();
});


// Try root path to debug
router.post("/", (req, res) => {
  // console.log("POST / handler reached");
  sendChatMessage(req, res);
});

// Catch-all for this router
router.use((req, res) => {
  // console.log(`Chat router 404: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Chat route not found" });
});

export default router;