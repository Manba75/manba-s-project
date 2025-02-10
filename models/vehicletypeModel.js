import db from "../config/db.js";

export const checkVehicleType = async (vehicleType) => {
 
  const checkQuery = "SELECT * FROM vehicletypes WHERE vehicletype_type  = $1 ";
  const checkResult = await db.query(checkQuery, [vehicleType]);

  if (checkResult.rows.length > 0) {
   
    return checkResult.rows[0];
  }
};

export const insertVehicleTypes = async (vehicletype, max_weight, createdIp) => {
  
  try {
    const vehicleTypesQuery = "INSERT INTO vehicletypes(vehicletype_type,vehicletype_max_weight, vehicletype_created_on,vehicletype_updated_on, vehicletype_created_ip) VALUES($1, $2,CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3) RETURNING *";

  const vehicleTypeResult = await db.query(vehicleTypesQuery, [vehicletype, max_weight, createdIp]);

  if (vehicleTypeResult.rows.length === 0) {
    return null;
  }

  return vehicleTypeResult.rows[0];
    
  } catch (error) {
    console.log("error",error)
  }
};


export const getVehicleTypeById = async (id) => {
  const vehicleTypeQuery = "SELECT * FROM vehicletypes WHERE id=$1 ";
  const vehicleTypeResult = await db.query(vehicleTypeQuery, [id]);
  if (vehicleTypeResult.rows.length === 0) {
    return null;
  }
  return vehicleTypeResult.rows[0];
};

export const getAllvehicleType = async () => {
  const vehicleTypeQuery = "SELECT * FROM vehicletypes ";
  const vehicleTypeResult = await db.query(vehicleTypeQuery, []);
  if (vehicleTypeResult.rows.length === 0) {
    return null;
  }
  return vehicleTypeResult.rows;
};

export const getVehicleTypeId= async(vehicletype)=>{
  await db.query("BEGIN")
    try {
        const vehicleTypeQuery =
      "SELECT id FROM vehicletypes WHERE vehicletype_type = $1";
    const vehicletypeResult = await db.query(vehicleTypeQuery, [vehicletype]);
    if (vehicletypeResult.rows.length === 0) {
      await db.query("ROLLBACK")
      throw new Error("Vehicle type not found!");
    }
    const vehicletype_id = vehicletypeResult.rows[0].id;
    await db.query("COMMIT")
    return vehicletype_id;
    } catch (error) {
       await db.query("ROLLBACK");
        console.log(error)
    }
}



// Update Vehicle Type
export const updateVehicleType = async (
  id,
  vehicletype,
  max_weight,
  updatedIp
) => {
  try {
    const updateQuery = `
      UPDATE vehicletypes 
      SET vehicletype_type = $1, vehicletype_max_weight = $2, vehicletype_updated_on = CURRENT_TIMESTAMP, vehicletype_created_ip = $3 
      WHERE id = $4  AND is_deleted=false RETURNING *;
    `;

    const updateResult = await db.query(updateQuery, [
      vehicletype,
      max_weight,
      updatedIp,
      id,
    ]);

    if (updateResult.rowCount === 0) {
      throw new Error(`No vehicle type found with ID ${id}`);
    }

    return updateResult.rows[0];
  } catch (error) {
    throw new Error("Error updating vehicle type: " + error.message);
  }
};

// Delete Vehicle Type
export const deleteVehicleType = async (id) => {
  try {
    const deleteQuery = `
      UPDATE vehicletypes 
      SET is_deleted = TRUE, vehicletype_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $1 RETURNING *;
    `;

    const deleteResult = await db.query(deleteQuery, [id]);

    if (deleteResult.rowCount === 0) {
      throw new Error(`No vehicle type found with ID ${id}`);
    }

    return deleteResult.rows[0];
  } catch (error) {
    throw new Error("Error deleting vehicle type: " + error.message);
  }
};
