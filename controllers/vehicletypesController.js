import requestIp from "request-ip";
import formatResponse from "../helpers/formateResponse.js";
import {
  checkVehicleType,
 getAllvehicleType,
  insertVehicleTypes,
  getVehicleTypeById,
  deleteVehicleType,
  updateVehicleType
} from "../models/vehicletypeModel.js";


export const createvehicletype = async (req, res) => {
  try {
    const { vehicletype, max_weight } = req.body;

    const createdIp = requestIp.getClientIp(req);

    const existingvehicletype = await checkVehicleType(vehicletype);
    if (existingvehicletype) {
      return res
        .status(400)
        .json(formatResponse(0, "vehicletypes is already present"));
    }

    const vehicletypes = await insertVehicleTypes(vehicletype, max_weight, createdIp);
    console.log("vehicles", vehicletypes);

    return res.status(200).json(
      formatResponse(1, "vehicle type created success", {
        vehicletypes: vehicletypes,
      })
    );
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal server error"));
  }
};

export const getvehicletypeId = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicletypes = await getVehicleTypeById(id);
    if(!vehicletypes){
         return res.status(400).json(
           formatResponse(1, "vehicletypes is not present id", {
             vehicletypes: vehicletypes,
           })
         );
    }
    console.log("vehicletypes", vehicletypes);

    return res
      .status(200)
      .json(
        formatResponse(1, "vehicletypes get success", {
          vehicletypes: vehicletypes,
        })
      );
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal server error"));
  }
};

export const getAllvehicletypes = async (req, res) => {
  try {
    const vehicletypes = await getAllvehicleType();
    console.log("vehicletypes",vehicletypes);

    return res
      .status(200)
      .json(formatResponse(1, "vehicletypes  all get success", { vehicletypes }));
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal server error"));
  }
};

export const updateVehicleTypeController = async (req, res) => {
  const { id } = req.params;
  const { vehicletype, max_weight, updatedIp } = req.body;

  if (!vehicletype || !max_weight || !updatedIp) {
    return res
      .status(400)
      .json(formatResponse(0,"all feild are required"));
  }

  try {
    const updatedVehicleType = await updateVehicleType(
      id,
      vehicletype,
      max_weight,
      updatedIp
    );
    res.status(200).json(formatResponse(1,"vehicle type is updated ",updatedVehicleType));
  } catch (error) {
    res.status(500).json(formatResponse(0, "internal server error",error));
  }
};

// Soft Delete Vehicle Type Controller
export const deleteVehicleTypeController = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedVehicleType = await deleteVehicleType(id);
    res
      .status(200)
      .json({
        success: true,
        message: "Vehicle type deleted successfully",
        data: deletedVehicleType,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting vehicle type",
        error: error.message,
      });
  }
};