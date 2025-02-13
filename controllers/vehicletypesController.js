import requestIp from "request-ip";
import formatResponse from "../helpers/formateResponse.js";
import {
  checkVehicleType,
  insertVehicleTypes,
  getVehicleTypeById,
  deleteVehicleType,
  updateVehicleType,
  getAllVehicleTypes,
} from "../models/vehicletypeModel.js";
import { vehicletypeValidation } from "../middleware/validation.js";

export const createvehicletype = async (req, res) => {
  try {
    const { vehicletype, max_weight } = req.body;

    const createdIp = requestIp.getClientIp(req);
    await vehicletypeValidation.validateAsync(req.body);

    

    const vehicletypes = await insertVehicleTypes(
      vehicletype,
      max_weight,
      createdIp
    );

    if (!vehicletypes || vehicletype.error || vehicletype.success === false) {
      return res.status(400).json(formatResponse(1, vehicletypes.message));
    }
    // console.log("vehicles", vehicletypes);

    return res
      .status(200)
      .json(formatResponse(1, vehicletypes.message, vehicletypes.data));
  } catch (error) {
    if(error.isJoi){
 return res.status(400).json(formatResponse(0, error.message));
    }
   
  }
};

export const getvehicletypeId = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicletypes = await getVehicleTypeById(id);
    if (!vehicletypes) {
      return res.status(400).json(formatResponse(1, vehicletypes.message));
    }
    // console.log("vehicletypes", vehicletypes);

    return res
      .status(200)
      .json(formatResponse(1, vehicletypes.message, vehicletypes.data));
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal server error"));
  }
};

export const getAllvehicletypes = async (req, res) => {
  try {
    const vehicletypes = await getAllVehicleTypes();

    if (!vehicletypes || vehicletypes.success == false) {
      return res
        .status(400)
        .json(formatResponse(0, vehicletypes.message, vehicletypes.data));
    }

    return res
      .status(200)
      .json(formatResponse(1, vehicletypes.message, vehicletypes.data));
  } catch (error) {
    return res
      .status(400)
      .json(formatResponse(0, "Internal server error", error.message));
  }
};

export const updateVehicleTypeController = async (req, res) => {
  const { id } = req.params;
  const { vehicletype, max_weight } = req.body;

  await vehicletypeValidation.validateAsync(req.body);

  try {
    const updatedVehicleType = await updateVehicleType(
      id,
      vehicletype,
      max_weight
    );
    // console.log(updateVehicleType)
    if (
      !updatedVehicleType ||
      updatedVehicleType.error ||
      updatedVehicleType.success === false
    ) {
      return res
        .status(400)
        .json(
          formatResponse(1, updatedVehicleType.message, updatedVehicleType.data)
        );
    }

    return res
      .status(200)
      .json(
        formatResponse(1, updatedVehicleType.message, updatedVehicleType.data)
      );
  } catch (error) {
    res.status(500).json(formatResponse(0, "internal server error", error));
  }
};

// Soft Delete Vehicle Type Controller
export const deleteVehicleTypeController = async (req, res) => {
  const { id } = req.params;

  try {
    const deleteVehicleTypes = await deleteVehicleType(id);

    if (!deleteVehicleTypes || deleteVehicleTypes.success === false) {
      res.status(400).json(formatResponse(0, deleteVehicleTypes.message));
    }
    res
      .status(200)
      .json(
        formatResponse(1, deleteVehicleTypes.message, deleteVehicleTypes.data)
      );
  } catch (error) {
    res.status(500).json(formatResponse(0, error.message));
  }
};
