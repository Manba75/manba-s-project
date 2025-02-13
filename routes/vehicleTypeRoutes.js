import express from "express";

import {
  createvehicletype,
  deleteVehicleTypeController,
  getAllvehicletypes,
  getvehicletypeId,
  updateVehicleTypeController,
} from "../controllers/vehicletypesController.js";
const router = express.Router();


//vehicletypes

router.post("/create", createvehicletype);
router.get("/get-vehicletype/:id", getvehicletypeId);
router.get("/getallvehicletypes", getAllvehicletypes);
router.put("/update/:id", updateVehicleTypeController);
router.put("/delete/:id", deleteVehicleTypeController);

export default router;
