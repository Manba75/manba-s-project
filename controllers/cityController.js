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

export const createCity = async (req, res) => {
  try {
    const { city, state } = req.body;

    const createdIp = requestIp.getClientIp(req);

    const existingCity = await checkCity(city);
    if (existingCity) {
      return res
        .status(400)
        .json(formatResponse(0, "cities is already present"));
    }

    const cities = await insertCity(city, state, createdIp);
    console.log("cities", cities);

    return res
      .status(200)
      .json(formatResponse(1, "Cities created success", { cities: cities }));
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal server error"));
  }
};

export const getCityId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(formatResponse(0, "City ID is required"));
    }

    const city = await getCityById(id);

    if (!city) {
      return res.status(404).json(formatResponse(0, "City with this ID not found"));
    }

    return res.status(200).json(formatResponse(1, "City retrieved successfully", { city }));
  } catch (error) {
    console.error("Error fetching city:", error);
    return res.status(500).json(formatResponse(0, "Internal server error", { error: error.message }));
  }
};

//update



export const getAllcities = async (req, res) => {
  try {
    const cities = await getAllCity();
    console.log("cities", cities);

    return res
      .status(200)
      .json(formatResponse(1, "Cities  all get success", { cities }));
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal server error"));
  }
};

//updae
export const updateCityController = async (req, res) => {
  const { id } = req.params;
  const { city, state } = req.body;

  if (!city || !state) {
    return res
      .status(400)
      .json(formatResponse(0,"Required all feild"));
  }

  try {
    const updatedCity = await updateCity(id, city, state);
    if(!updateCity.success){
      return res
        .status(200)
        .json(formatResponse(0, "city  updating fail already present  city "));
    }
   return  res
      .status(200)
      .json(formatResponse(1,"city updated successfully ",updatedCity));
  } catch (error) {
    return res
      .status(500)
      .json(formatResponse(0,"Intersnal server error"));
  }
};


export const deleteCityController = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCity = await deleteCity(id);
     return res
      .status(200)
      .json(
        formatResponse(1,"City deleted success",deleteCity));
  } catch (error) {
     return res.status(500).json(formatResponse(0, "Intersnal server error"));
  }
};
