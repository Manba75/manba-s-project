import db from "../config/db.js";
import { errorResponse } from "../helpers/errorResponse.js"; // Assuming this is your helper function for error handling

await db.query("SET TIME ZONE 'Asia/Kolkata';");

const checkEmail = async (email) => {
  try {
    db.query("BEGIN");
    const query = `SELECT * FROM deliverypartners WHERE dpartner_email = $1  AND dpartner_is_deleted=false`;
    const result = await db.query(query, [email]);
    db.query("COMMIT");

    if (result.rows.length === 0) {
      db.query("ROLLBACK");
      return null;
    }

    return result.rows[0];
  } catch (error) {
    db.query("ROLLBACK");
    console.error("Error checking email in database:", error);
    return errorResponse("Error during checking email.", error);
  }
};

// Delivery partner signup function with transaction
const dpartnerSignup = async (
  city_id,
  vehicletype_id,
  dpartner_email,
  dpartner_pass,
  dpartner_created_ip,
  dpartner_licence,
  dpartner_phone,
  vehicle_number,
  vehicle_name,
  otp
) => {
  try {
    await db.query("BEGIN"); // Start transaction

    // Insert the delivery partner
    const dpartnerQuery = `
      INSERT INTO deliveryPartners(
          dpartner_email, dpartner_password, dpartner_phone,
          dpartner_city_id, dpartner_created_on, dpartner_updated_on,
          dpartner_created_ip, dpartner_last_login, dpartner_isavailable, 
          dpartner_licence_number, dpartner_isverify, dpartner_verifyotp, 
          dpartner_expiryotp ,dpartner_is_deleted
      ) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', $5, 
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',false, $6, 
              false, $7, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata' + INTERVAL '10 minutes',
              false) 
      RETURNING id `;

    const dpartnerResult = await db.query(dpartnerQuery, [
      dpartner_email,
      dpartner_pass,
      dpartner_phone,
      city_id,
      dpartner_created_ip,
      dpartner_licence,
      otp,
    ]);

    if (dpartnerResult.rows.length === 0) {
      db.query("ROLLBACK");
      return errorResponse(
        "Delivery partner could not be created.",
        new Error("No result from insertion")
      );
    }

    const dpartner_id = dpartnerResult.rows[0].id;

    // Check if vehicle already exists for this partner
    const existingVehicleQuery = `SELECT id FROM vehicles WHERE vehicle_number = $1 AND dpartner_id = $2`;
    const existingVehicleResult = await db.query(existingVehicleQuery, [
      vehicle_number,
      dpartner_id,
    ]);

    if (existingVehicleResult.rows.length > 0) {
      await db.query("ROLLBACK");
      return errorResponse(
        "Vehicle with this number already exists for the delivery partner!",
        new Error("Vehicle exists")
      );
    }

    // Insert Vehicle
    const vehicleQuery = `
      INSERT INTO vehicles(
          vehicle_number, vehicletype_id, vehicle_name, 
          dpartner_id, vehicle_created_on, vehicle_updated_on, 
          vehicle_created_ip
      ) 
      VALUES ($1, $2, $3, $4,  
              CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 
              $5)
      RETURNING *;
    `;

    const vehicleResult = await db.query(vehicleQuery, [
      vehicle_number,
      vehicletype_id,
      vehicle_name,
      dpartner_id,
      dpartner_created_ip,
    ]);

    // Commit transaction if everything is successful
    await db.query("COMMIT");

    return {
      success: true,
      delivery_partner: dpartnerResult.rows[0],
      vehicle: vehicleResult.rows[0],
    };
  } catch (error) {
    await db.query("ROLLBACK"); // Rollback transaction on error
    console.error("Error in signup:", error);
    return errorResponse("Error during signup.", error);
  }
};

// Update OTP
const updateOTP = async (email, otp, expiryotp) => {
  try {
    await db.query("BEGIN");
    const query = `
      UPDATE deliverypartners
      SET dpartner_verifyotp = $2, dpartner_expiryotp = $3, dpartner_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false RETURNING *;
    `;
    await db.query("ROLLBACK");
    return await db.query(query, [email, otp, expiryotp]);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating OTP:", error);
    return errorResponse("Error during updating OTP.", error);
  }
};

// Verify User OTP
const verifydpartnerOTP = async (email) => {
  try {
    db.query("BEGIN");
    const query = `
      UPDATE deliverypartners 
      SET dpartner_isverify = true, dpartner_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false
      RETURNING *;
    `;
    await db.query("COMMIT");
    const result = await db.query(query, [email]);
    if (!result) {
      return null;
    }
    return result.rows[0];
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error verifying OTP:", error);
    return errorResponse("Error during OTP verification.", error);
  }
};

// Update reset token
const updateResetToken = async (email, resettoken, resettoken_expiry) => {
  try {
    await db.query("BEGIN");
    const query = `
      UPDATE deliverypartners 
      SET dpartner_resettoken = $2, dpartner_resettoken_expiry = $3, 
          dpartner_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false
      RETURNING *;
    `;
    await db.query("COMMIT");
    return await db.query(query, [email, resettoken, resettoken_expiry]);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating reset token:", error);
    return errorResponse("Error during reset token update.", error);
  }
};

// Update password
const updatePassword = async (email, password) => {
  try {
    await db.query("BEGIN");
    const query = `
      UPDATE deliverypartners 
      SET dpartner_password = $2, 
          dpartner_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 
          dpartner_resettoken = NULL, 
          dpartner_resettoken_expiry = NULL
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false
      RETURNING *;
    `;
    await db.query("COMMIT");
    return await db.query(query, [email, password]);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating password:", error);
    return errorResponse("Error during password update.", error);
  }
};

// Get all delivery partners
const getAllDpartner = async () => {
  try {
    db.query("BEGIN");
    const query = `SELECT * FROM deliverypartners  WHERE dpartner_is_deleted=false`;
    const result = await db.query(query);
    db.query("COMMIT");
    return result.rows;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error fetching delivery partners:", error);
    return errorResponse("Error during fetching delivery partners.", error);
  }
};

// Get one delivery partner by ID
const getDpartnerById = async (id) => {
  try {
    db.query("BEGIN");
    const query = `SELECT  dp.id , dp.dpartner_email, dp.dpartner_isverify, dp.dpartner_licence_number, c.city_name, c.city_state_name 
                   FROM deliverypartners dp 
                   JOIN cities c ON dp.dpartner_city_id = c.id 
                   WHERE dp.id = $1  AND dpartner_is_deleted=false `;
    const result = await db.query(query, [id]);
    await db.query("COMMIT");

    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error fetching delivery partner by ID:", error);
    return errorResponse(
      "Error during fetching delivery partner by ID.",
      error
    );
  }
};

// Update delivery partner profile
const updateDpartnerProfile = async (id, phone, name) => {
  try {
    db.query("BEGIN");
    const query = `
      UPDATE deliverypartners 
      SET dpartner_name = $1, dpartner_phone = $2, dpartner_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $3 AND dpartner_is_deleted=false
      RETURNING *;
    `;
    const result = await db.query(query, [name, phone, id]);
    if (result.rows.length === 0) {
      return errorResponse(false, "Error updating profile.");
    }
    await db.query("COMMIT");
    return errorResponse(true, "updating profile. success", result);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating profile:", error);
    return errorResponse("Error during updating profile.", error);
  }
};

// Delete delivery partner
const dpartnerProfileDelete = async (id) => {
  try {
    await db.query("BEGIN");

    const query = `
      UPDATE deliverypartners SET dpartner_is_deleted =true, dpartner_updated_on = CURRENT_TIMESTAMP   WHERE id = $1 RETURNING *
    `;

    const result = await db.query(query, [id]);

    // If no row was deleted, it means the ID wasn't found
    if (result.rowCount === 0) {
      throw new Error(`No delivery partner found with ID ${id}`);
    }
    const deleteResult = result.rows;
    await db.query("COMMIT");

    // Return the deleted delivery partner data
    return errorResponse(true, " success", deleteResult);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error deleting profile:", error);

    // Return a custom error response
    return errorResponse(false, "Error in deleteing partner");
  }
};

// Get available delivery partners from the database
const getAvailableDPartners = async () => {
  try {
    const query =
      "SELECT * FROM deliverypartners WHERE dpartner_isavailable = true AND dpartner_is_deleted=false";
    const result = await db.query(query);
    if (result.rows.length === 0) {
      return errorResponse(false, "No availabe delivery partners");
    }
    return result.rows;
  } catch (error) {
    console.error("Error deleting profile:", error);
    return errorResponse("Error during  availabilty.", error);
  }
};

// Function to set the delivery partner as available again
const setdPartnerAvailable = async (dpartnerId, isAvailable) => {
  try {
    const updateAvailabilityQuery =
      "UPDATE deliverypartners SET dpartner_isavailable = $2 ,dpartner_updated_on = CURRENT_TIMESTAMP  WHERE id = $1 AND dpartner_is_deleted=false RETURNING *";

    const updateResult = await db.query(updateAvailabilityQuery, [
      dpartnerId,
      isAvailable,
    ]);

    if (updateResult.rowCount === 0) {
      return errorResponse(
        false,
        "Failed to update availability of delivery partner"
      );
    }
    const updateData = updateResult.rows[0];

    return errorResponse(true, "Updated query success", updateData); // Returning updated row
  } catch (error) {
    console.error("Error setting partner available:", error);
    return errorResponse(false, "Internal server error");
  }
};

// check delivery partner available or not

const checkDpartnerAvailability = async (dpartnerId) => {
  try {
    const checkAvailabilityQuery = `
      SELECT dpartner_isavailable FROM deliverypartners WHERE id=$1 AND dpartner_is_deleted=false
    `;

    const result = await db.query(checkAvailabilityQuery, [dpartnerId]);

    if (result.rowCount === 0) {
      return {
        success: false,
        message: "Delivery partner not found.",
      };
    }

    const isAvailable = result.rows[0].dpartner_isavailable;

    return {
      success: true,
      message: isAvailable
        ? "Delivery partner is available."
        : "Delivery partner is not available.",
      isAvailable,
    };
  } catch (error) {
    console.error("Error checking partner availability:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
};

// getDpartner
export {
  checkEmail,
  dpartnerSignup,
  updateOTP,
  verifydpartnerOTP,
  updateResetToken,
  updatePassword,
  getAllDpartner,
  getDpartnerById,
  updateDpartnerProfile,
  dpartnerProfileDelete,
  getAvailableDPartners,
  setdPartnerAvailable,
  checkDpartnerAvailability,
};
