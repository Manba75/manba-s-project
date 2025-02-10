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
import { updateDpartnerProfile } from "../models/deliveryPartnerModel.js";
import { getOneOrder, placeOrder ,getAllOrders, updateOrder } from "../controllers/orderAuth.js";
import { createCity, deleteCityController, getAllcities, getCityId, updateCityController } from "../controllers/cityController.js";
import { createvehicletype, deleteVehicleTypeController, getAllvehicletypes, getvehicletypeId, updateVehicleTypeController } from "../controllers/vehicletypesController.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("You are in home page");
});

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

// delivery partner API
router.post("/dpartner-signup", deliveryPartnerSignup);
router.post("/checks-email", dpartnerchecksEmail);
router.post("/dpartner-verify-otp", dpartnerVerifyOTP);
router.post("/dpartner-resend-otp", dpartnerResenOTP);
router.post("/dpartner-login", dpartnerLogin);
router.post("/dpartner-forgot-password", dpartnerForgotPassword);
router.post("/dpartner-reset-password", dpartnerResetPassword);
router.get("/dpartner-getallusers", getAlldpartnerProfile);
router.get("/dpartner-getuser/:id", dpartnerAuthenticate, getdpartnerProfile);
router.put(
  "/dpartner-update-profile/:id",
  dpartnerAuthenticate,
  dpartnerUpdateProfile
);
router.put(
  "/dpartner-delete-profile/:id",
  dpartnerAuthenticate,
  dpartnerDeleteProfile
);
router.put("/dpartner-available/:id",dpartnerAuthenticate,dpartnerIsAvailable)
//cities

router.post("/city/create",createCity)
router.get("/city/get-city/:id",getCityId)
router.get("/city/allcities", getAllcities);
router.put("/city/update/:id",updateCityController)
router.put("/city/delete/:id", deleteCityController);
//vehicletypes

router.post("/vehicletypes/create", createvehicletype);
router.get("/vehicletypes/get-vehicletype/:id", getvehicletypeId);
router.get("/vehicletypes/getallvehicletypes", getAllvehicletypes);
router.get("/vehicletypes/update/:id", updateVehicleTypeController);
router.get("/vehicletypes/delete/:id", deleteVehicleTypeController);
//order 
router.post("/order/place-order",authenticate,placeOrder)
router.get("/order/get-oneorder/:id", authenticate, getOneOrder);
router.get("/order/get-allorder", authenticate, getAllOrders);
router.put("/order/update-status/:id",dpartnerAuthenticate, updateOrder);
router.put("/order/verify-otp/:id", dpartnerAuthenticate, verifyOTP);

export default router;
