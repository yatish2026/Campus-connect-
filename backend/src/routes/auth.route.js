import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/google", authController.googleAuth);

//!get current user
router.get("/me", protectRoute, authController.getCurrentUser);

export default router;
