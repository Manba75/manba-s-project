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
import {
  authenticate,
  dpartnerAuthenticate,
} from "../middleware/authenticate.middleware.js";
import { getAllUser } from "../models/usermodel.js";
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


const router = express.Router();

// customers API

router.post("/customer/signup", signup);
router.post("/customer/verify-otp", verifyOTP);
router.post("/customer/resend-otp", resendOTP);
router.post("/customer/check-email", checksEmail);
router.post("/customer/login", login);
router.post("/customer/forgot-password", forgotPassword);
router.post("/customer/reset-password", resetPassword);
router.put("/customer/update-profile/:id", authenticate, updateProfile);
router.put("/customer/delete-profile/:id", authenticate, deleteUser);
router.get("/customer/get-users", getAllUserProfile);
router.post("/customer/logout", authenticate, logout);




// delivery partner API
router.post("/dpartner/signup", deliveryPartnerSignup);
router.post("/dpartner/checks-email", dpartnerchecksEmail);
router.post("/dpartner/verify-otp", dpartnerVerifyOTP);
router.post("/dpartner/resend-otp", dpartnerResenOTP);
router.post("/dpartner/login", dpartnerLogin);
router.post("/dpartner/forgot-password", dpartnerForgotPassword);
router.post("/dpartner/reset-password", dpartnerResetPassword);
router.get("/dpartner/getallusers", getAlldpartnerProfile);
router.get("/dpartner/getuser/:id", dpartnerAuthenticate, getdpartnerProfile);
router.put(
  "/dpartner/update-profile/:id",
  dpartnerAuthenticate,
  dpartnerUpdateProfile
);
router.put(
  "/dpartner/delete-profile/:id",
  dpartnerAuthenticate,
  dpartnerDeleteProfile
);
router.put(
  "/dpartner/available/:id",
  dpartnerAuthenticate,
  dpartnerIsAvailable
);

export default router;
