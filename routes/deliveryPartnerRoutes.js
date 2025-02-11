import express from "express";
import {
  deliveryPartnerSignup,
  dpartnerchecksEmail,
  dpartnerDeleteProfile,
  dpartnerForgotPassword,
  dpartnerIsAvailable,
  dpartnerLogin,
  dpartnerResenOTP,
  dpartnerResetPassword,
  dpartnerUpdateProfile,
  dpartnerVerifyOTP,
  getAlldpartnerProfile,
  getdpartnerProfile,
} from "../controllers/deliveryPartnerAuth.js";
import { dpartnerAuthenticate } from "../middleware/authenticate.middleware.js";

const router = express.Router();

// delivery partner API
router.post("/signup", deliveryPartnerSignup);
router.post("/checks-email", dpartnerchecksEmail);
router.post("/verify-otp", dpartnerVerifyOTP);
router.post("/resend-otp", dpartnerResenOTP);
router.post("/login", dpartnerLogin);
router.post("/forgot-password", dpartnerForgotPassword);
router.post("/reset-password", dpartnerResetPassword);
router.get("/getallusers", getAlldpartnerProfile);
router.get("/getuser/:id", dpartnerAuthenticate, getdpartnerProfile);
router.put("/update-profile/:id", dpartnerAuthenticate, dpartnerUpdateProfile);
router.put("/delete-profile/:id", dpartnerAuthenticate, dpartnerDeleteProfile);
router.put("/available/:id", dpartnerAuthenticate, dpartnerIsAvailable);

export default router;
