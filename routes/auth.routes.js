import express from "express";

import {signup, login, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, getCurrentUser, getAdminDashboard} from "../controllers/auth.controllers.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
router.get("/me", protect, getCurrentUser);
router.get("/admin", protect, authorize("admin"), getAdminDashboard);

export default router;