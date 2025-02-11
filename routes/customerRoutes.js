import express from "express";
import {
  signup,
  verifyOTP,
  resendOTP,
  checksEmail,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
  getAllUserProfile,
  deleteUser,
  logout,
} from "../controllers/userAuth.js";
import { authenticate } from "../middleware/authenticate.middleware.js";

const router = express.Router();

// customers API

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/check-email", checksEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/update-profile/:id", authenticate, updateProfile);
router.put("/delete-profile/:id", authenticate, deleteUser);
router.get("/get-users", getAllUserProfile);
router.post("/logout", authenticate, logout);

export default router;
