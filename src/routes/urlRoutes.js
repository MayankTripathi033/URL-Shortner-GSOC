// src/routes/urlRoutes.js
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { UrlController } from "../controllers/urlController.js";
import { db } from "../config/firebase.js";

const router = express.Router();
const urlController = new UrlController(db); // Properly inject db instance

router.post("/shorten", authMiddleware, urlController.shortenUrl);
router.get("/:shortCode", urlController.getOriginalUrl);

export default router;
