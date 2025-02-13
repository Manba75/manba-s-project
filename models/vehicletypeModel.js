import db from "../config/db.js";
import { Response } from "../helpers/Response.js";

export const checkVehicleType = async (vehicleType) => {
  try {
    const checkQuery =
      "SELECT * FROM vehicletypes WHERE vehicletype_type = $1 AND is_deleted = FALSE";
    const checkResult = await db.query(checkQuery, [vehicleType]);

    if (checkResult.rows.length > 0) {
      return Response(false, "Vehicle type already exists");
    }
    return Response(true, "Vehicle type available", null);
  } catch (error) {
    return Response(false, "Error checking vehicle type", null, error.message);
  }
};

export const insertVehicleTypes = async (
  vehicletype,
  max_weight,
  createdIp
) => {
  try {
    // Check if the vehicle type exists (including soft-deleted ones)
    const checkQuery = "SELECT * FROM vehicletypes WHERE vehicletype_type = $1";
    const checkResult = await db.query(checkQuery, [vehicletype]);

    if (checkResult.rows.length > 0) {
      const existingVehicle = checkResult.rows[0];

      if (existingVehicle.is_deleted) {
        // If vehicle type exists but is deleted, reactivate it
        const reactivateQuery = `
          UPDATE vehicletypes 
          SET is_deleted = FALSE, vehicletype_max_weight = $1, vehicletype_updated_on = CURRENT_TIMESTAMP, vehicletype_created_ip = $2
          WHERE id = $3 RETURNING *;
        `;
        const reactivateResult = await db.query(reactivateQuery, [
          max_weight,
          createdIp,
          existingVehicle.id,
        ]);

        return Response(
          true,
          "Vehicle type reactivated successfully",
          reactivateResult.rows[0]
        );
      }

      return Response(false, "Vehicle type already exists");
    }

    // Insert new vehicle type if it doesn't exist
    const vehicleTypesQuery = `
      INSERT INTO vehicletypes (vehicletype_type, vehicletype_max_weight, vehicletype_created_on, vehicletype_updated_on, vehicletype_created_ip, is_deleted) 
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3, FALSE) RETURNING *;
    `;
    const vehicleTypeResult = await db.query(vehicleTypesQuery, [
      vehicletype,
      max_weight,
      createdIp,
    ]);

    return Response(
      true,
      "Vehicle type inserted successfully",
      vehicleTypeResult.rows[0]
    );
  } catch (error) {
    return Response(false, "Error inserting vehicle type", null, error.message);
  }
};

export const getVehicleTypeById = async (id) => {
  try {
    const vehicleTypeQuery =
      "SELECT * FROM vehicletypes WHERE id = $1 AND is_deleted = FALSE";
    const vehicleTypeResult = await db.query(vehicleTypeQuery, [id]);

    if (vehicleTypeResult.rows.length === 0) {
      return Response(false, `No vehicle type found with ID ${id}`);
    }

    return Response(true, "Vehicle type found", vehicleTypeResult.rows[0]);
  } catch (error) {
    return Response(
      false,
      "Error retrieving vehicle type",
      null,
      error.message
    );
  }
};

export const getAllVehicleTypes = async () => {
  try {
    const vehicleTypeQuery =
      "SELECT * FROM vehicletypes WHERE is_deleted = FALSE";
    const vehicleTypeResult = await db.query(vehicleTypeQuery);

    if (vehicleTypeResult.rows.length === 0) {
      return Response(false, "No vehicle types found");
    }

    return Response(
      true,
      "Vehicle types retrieved successfully",
      vehicleTypeResult.rows
    );
  } catch (error) {
    return Response(
      false,
      "Error retrieving vehicle types",
      null,
      error.message
    );
  }
};

export const getVehicleTypeId = async (vehicletype) => {
  try {
    const vehicleTypeQuery =
      "SELECT id FROM vehicletypes WHERE vehicletype_type = $1 AND is_deleted = FALSE";
    const vehicletypeResult = await db.query(vehicleTypeQuery, [vehicletype]);

    if (vehicletypeResult.rows.length === 0) {
      return Response(false, "Vehicle type not found");
    }

    return Response(
      true,
      "Vehicle type ID retrieved",
      vehicletypeResult.rows[0].id
    );
  } catch (error) {
    return Response(
      false,
      "Error retrieving vehicle type ID",
      null,
      error.message
    );
  }
};

export const updateVehicleType = async (id, vehicletype, max_weight) => {
  try {
    const updateQuery = `
      UPDATE vehicletypes 
      SET vehicletype_type = $1, vehicletype_max_weight = $2, 
      vehicletype_updated_on = CURRENT_TIMESTAMP
      WHERE id = $3 AND is_deleted = FALSE RETURNING *;
    `;

    const updateResult = await db.query(updateQuery, [
      vehicletype,
      max_weight,
      id,
    ]);

    if (updateResult.rowCount === 0) {
      return Response(false, `No vehicle type found with ID ${id}`);
    }

    return Response(
      true,
      "Vehicle type updated successfully",
      updateResult.rows[0]
    );
  } catch (error) {
    return Response(false, "Error updating vehicle type", null, error.message);
  }
};


export const deleteVehicleType = async (id) => {
  try {
    const deleteQuery = `
      UPDATE vehicletypes 
      SET is_deleted = TRUE, vehicletype_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $1 AND is_deleted = FALSE RETURNING *;
    `;

    const deleteResult = await db.query(deleteQuery, [id]);

    if (deleteResult.rowCount === 0) {
      return Response(false, `No vehicle type found with ID ${id}`);
    }

    return Response(
      true,
      "Vehicle type deleted successfully",
      deleteResult.rows[0]
    );
  } catch (error) {
    return Response(false, "Error deleting vehicle type", null, error.message);
  }
};
