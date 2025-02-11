import {
  createCity,
  deleteCityController,
  getAllcities,
  getCityId,
  updateCityController,
} from "../controllers/cityController.js";
import express from "express";

const router = express.Router();

//cities

router.post("/create",createCity)
router.get("/get-city/:id",getCityId)
router.get("/allcities", getAllcities);
router.put("/update/:id",updateCityController)
router.put("/delete/:id", deleteCityController);

export default router;