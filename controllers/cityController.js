import requestIp from "request-ip";
import formatResponse from "../helpers/formateResponse.js";
import {
  checkCity,
  getAllCity,
  getCityById,
  insertCity,
  updateCity,
  deleteCity
} from "../models/cityModel.js";
import { cityValidation } from "../middleware/validation.js";

export const createCity = async (req, res) => {
  try {
    const { city, state } = req.body;
     await cityValidation.validateAsync(req.body)
    const createdIp = requestIp.getClientIp(req);


    const cities = await insertCity(city, state, createdIp);
    if(!cities || cities.success==false){
      return res
        .status(500)
        .json(
          formatResponse(0,cities.message)
        );
    }

    return res.status(201).json(formatResponse(1, cities.message, cities.data));
  } catch (error) {
    console.error("Error creating city:", error);
    if(error.isJoi){
        return res
          .status(400)
          .json(
            formatResponse(0, "Error in joi", { error: error.message })
          );
    }
    return res.status(500).json(formatResponse(0, "Internal server error", { error: error.message }));
  }
};

export const getCityId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === 0) {
      return res.status(400).json(formatResponse(0, "City ID is required"));
    }

    const city = await getCityById(id);

    if (!city) {
      return res.status(404).json(formatResponse(0, city.message));
    }

    return res.status(200).json(formatResponse(1, city.message, city.data));
  } catch (error) {
    console.error("Error fetching city:", error);
    return res.status(500).json(formatResponse(0, "Internal server error", { error: error.message }));
  }
};

export const getAllcities = async (req, res) => {
  try {
    const cities = await getAllCity();

    if (!cities || cities.length === 0) {
      return res.status(404).json(formatResponse(0,cities.message));
    }

    return res.status(200).json(formatResponse(1, cities.message,cities.data));
  } catch (error) {
    console.error("Error fetching all cities:", error);
    return res.status(500).json(formatResponse(0, "Internal server error", { error: error.message }));
  }
};

export const updateCityController = async (req, res) => {
  const { id } = req.params;
  const { city, state } = req.body;

   await cityValidation.validateAsync({city,state})

  try {
    const updatedCity = await updateCity(id, city, state);

    if (!updatedCity.success) {
      return res.status(400).json(formatResponse(0, updatedCity.message));
    }

    return res.status(200).json(formatResponse(1, updatedCity.message, updatedCity.data));
  } catch (error) {
    console.error("Error updating city:", error);
    return res.status(500).json(formatResponse(0, "Internal server error", { error: error.message }));
  }
};

export const deleteCityController = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json(formatResponse(0, "City ID is required"));
  }

  try {
    const deletedCity = await deleteCity(id);

    if (!deletedCity) {
      return res.status(404).json(formatResponse(0, deletedCity.message));
    }

    return res.status(200).json(formatResponse(1, deletedCity.message,deleteCity.data));
  } catch (error) {
    console.error("Error deleting city:", error);
    return res.status(500).json(formatResponse(0, "Internal server error", { error: error.message }));
  }
};
