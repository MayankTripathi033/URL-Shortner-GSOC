import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

router.post("/signin", (req, res) => authController.signIn(req, res));
router.post("/signup", (req, res) => authController.signUp(req, res));
router.post("/signout", (req, res) => authController.signOut(req, res));
router.get("/google", (req, res) => authController.authGoogle(req, res));
router.get("/google/callback", (req, res) =>
  authController.authenticateGoogle(req, res)
);

export default router; // Just export the router
