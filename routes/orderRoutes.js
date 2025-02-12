import {
  getOneOrder,
  placeOrder,
  getAllOrders,
  updateOrder,
  verifyOTP
} from "../controllers/orderAuth.js";
import express from "express";
import {authenticate, dpartnerAuthenticate } from "../middleware/authenticate.middleware.js";

const router = express.Router();
//order 
router.post("/place-order",authenticate,placeOrder)
router.get("/get-oneorder/:id", authenticate, getOneOrder);
router.get("/get-allorder", authenticate, getAllOrders);
router.put("/update-status/:id",dpartnerAuthenticate, updateOrder);
router.put("/verify-otp/:id", dpartnerAuthenticate, verifyOTP);

export default router;