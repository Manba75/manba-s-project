import db from "../config/db.js";
import { Response } from "../helpers/Response.js"; // Assuming this is your helper function for error handling

await db.query("SET TIME ZONE 'Asia/Kolkata';");

export const checkEmail = async (email) => {
  try {
    const query = `SELECT * FROM deliverypartners WHERE dpartner_email = $1  `;
    const result = await db.query(query, [email]);

    if (result.rows.length === 0) {
      return Response(
        false,
        "No email is exists."
      );
    }

    return Response(true, "Email is fetch success", result.rows[0]);
  } catch (error) {
    console.error("Error checking email in database:", error);
    return Response("Error during checking email.", error);
  }
};

// Delivery partner signup function with transaction
export const dpartnerSignup = async (
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
    let dpartner_id;
    let vehicleResult;
    let dpartnerResult;
    // Check if the delivery partner already exists
    const checkQuery = `SELECT * FROM deliveryPartners WHERE dpartner_email = $1`;
    const existingDpartner = await db.query(checkQuery, [dpartner_email]);

    if (existingDpartner.rowCount > 0) {
      const dpartner = existingDpartner.rows[0];

      if (dpartner.dpartner_is_deleted) {
        // Reactivate and update all fields
        const reactivateQuery = `
          UPDATE deliveryPartners 
          SET dpartner_password = $2, 
              dpartner_phone = $3,
              dpartner_city_id = $4,
              dpartner_created_ip = $5, 
              dpartner_licence_number = $6,
              dpartner_isverify = false, 
              dpartner_verifyotp = $7,
              dpartner_expiryotp = CURRENT_TIMESTAMP + INTERVAL '10 minutes',
              dpartner_updated_on = CURRENT_TIMESTAMP,
              dpartner_last_login = CURRENT_TIMESTAMP,
              dpartner_is_deleted = false
          WHERE dpartner_email = $1
          RETURNING id;
        `;

          dpartnerResult = await db.query(reactivateQuery, [
          dpartner_email,
          dpartner_pass,
          dpartner_phone,
          city_id,
          dpartner_created_ip,
          dpartner_licence,
          otp,
        ]);

        if (dpartnerResult.rowCount === 0) {
          await db.query("ROLLBACK");
          return Response(false, "Failed to reactivate delivery partner.");
        }

         dpartner_id = dpartnerResult.rows[0].id; // Use the existing partner's ID
      } else {
        await db.query("ROLLBACK");
        return Response(false, "Email already exists.");
      }
    } else {
      // Insert new delivery partner
      const dpartnerQuery = `
        INSERT INTO deliveryPartners(
            dpartner_email, dpartner_password, dpartner_phone,
            dpartner_city_id, dpartner_created_on, dpartner_updated_on,
            dpartner_created_ip, dpartner_last_login, dpartner_isavailable, 
            dpartner_licence_number, dpartner_isverify, dpartner_verifyotp, 
            dpartner_expiryotp, dpartner_is_deleted
        ) 
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 
                CURRENT_TIMESTAMP, $5, 
                CURRENT_TIMESTAMP, false, $6, 
                false, $7, CURRENT_TIMESTAMP + INTERVAL '10 minutes',
                false) 
        RETURNING id;
      `;

       dpartnerResult = await db.query(dpartnerQuery, [
        dpartner_email,
        dpartner_pass,
        dpartner_phone,
        city_id,
        dpartner_created_ip,
        dpartner_licence,
        otp,
      ]);

      if (dpartnerResult.rows.length === 0) {
        await db.query("ROLLBACK");
        return Response(false, "Delivery partner could not be created.");
      }

      dpartner_id = dpartnerResult.rows[0].id;
    }

    // Check if the vehicle already exists for this partner (including soft-deleted ones)
    const existingVehicleQuery = `SELECT * FROM vehicles WHERE vehicle_number = $1 AND dpartner_id = $2`;
    const existingVehicleResult = await db.query(existingVehicleQuery, [
      vehicle_number,
      dpartner_id,
    ]);

    if (existingVehicleResult.rowCount > 0) {
      const vehicle = existingVehicleResult.rows[0];

      if (vehicle.vehicle_is_deleted) {
        // Reactivate and update vehicle details
        const reactivateVehicleQuery = `
          UPDATE vehicles 
          SET vehicletype_id = $2,
              vehicle_name = $3,
              vehicle_updated_on = CURRENT_TIMESTAMP,
              vehicle_created_ip = $4,
              is_deleted = false
          WHERE id = $1
          RETURNING *;
        `;

        const updateVehicleResult = await db.query(reactivateVehicleQuery, [
          vehicle.id,
          vehicletype_id,
          vehicle_name,
          dpartner_created_ip,
        ]);

        if (updateVehicleResult.rowCount === 0) {
          await db.query("ROLLBACK");
          return Response(false, "Failed to reactivate vehicle.");
        }

        vehicleResult = updateVehicleResult.rows[0]; // Save the updated vehicle result
      } else {
        await db.query("ROLLBACK");
        return Response(
          false,
          "Vehicle with this number already exists for the delivery partner!"
        );
      }
    } else {
      // Insert new vehicle
      const vehicleQuery = `
        INSERT INTO vehicles(
            vehicle_number, vehicletype_id, vehicle_name, 
            dpartner_id, vehicle_created_on, vehicle_updated_on, 
            vehicle_created_ip, is_deleted
        ) 
        VALUES ($1, $2, $3, $4,  
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 
                $5, false)
        RETURNING *;
      `;

       vehicleResult = await db.query(vehicleQuery, [
        vehicle_number,
        vehicletype_id,
        vehicle_name,
        dpartner_id,
        dpartner_created_ip,
      ]);

      if (vehicleResult.rowCount === 0) {
        await db.query("ROLLBACK");
        return Response(false, "Failed to register vehicle.");
      }
    }

    await db.query("COMMIT"); // Commit the transaction if everything is successful
     console.log(dpartner_id)
    return Response(true, "Delivery partner and vehicle created successfully", {
      dpartner_id:  dpartner_id ,
      dpartner:dpartnerResult.rows[0],
      vehicle: vehicleResult.rows[0],
    });
  } catch (error) {
    await db.query("ROLLBACK"); // Rollback the transaction in case of any error
    console.error("Error in signup:", error);
    return Response(false, "Error during signup.", [], error.message);
  }
};


export const updateLastLogin = async (email) => {
  try {
    const query = `
      UPDATE  deliverypartners
      SET dpartner_last_login = CURRENT_TIMESTAMP
      WHERE dpartner_email = $1 AND dpartner_is_deleted = false
      RETURNING *;
    `;
    const result = await db.query(query, [email]);

    if (result.rowCount === 0) {
      return Response(false, "User not found");
    }

    return Response(true, "User last login updated", result.rows[0]);
  } catch (error) {
    console.error("Error updating last login:", error);
    return Response(false, "Error updating last login", [], error.message);
  }
};

// Update OTP
export const updateOTP = async (email, otp, expiryotp) => {
  try {
    await db.query("BEGIN");

    const query = `
      UPDATE deliverypartners
      SET dpartner_verifyotp = $2, dpartner_expiryotp = $3, dpartner_updated_on = CURRENT_TIMESTAMP 
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false RETURNING *;
    `;

    const result = await db.query(query, [email, otp, expiryotp]);

    if (result.rows.length === 0) {
      awaitdb.query("ROLLBACK");
      return Response(
        false,
        "No delivery partner found with the provided email or user is deleted."
      );
    }

    await db.query("COMMIT");
    return Response(true, "OTP updated successfully", result.rows[0]);
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Error updating OTP:", error);
    return Response(false, "Error during updating OTP.", [], error.message);
  }
};

// Verify User OTP
export const verifydpartnerOTP = async (email) => {
  
  try {
    await db.query("BEGIN"); 

    const query = `
      UPDATE deliverypartners 
      SET dpartner_isverify = true, dpartner_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false
      RETURNING *;
    `;

   
    const result = await db.query(query, [email]);

    // Check if the result is empty (no records were updated)
    if (result.rows.length === 0) {
      await db.query("ROLLBACK"); 
      return Response(
        false,
        "No delivery partner found with the provided email or user is deleted."
      );
    }

    await db.query("COMMIT"); 
    return Response(true, "OTP verified successfully", result.rows[0]); 
  } catch (error) {
    await db.query("ROLLBACK"); 
    console.error("Error verifying OTP:", error); 
    return Response(false, "Error during OTP verification.", [], error.message);
  } 
};

// Update reset token
 export const updateResetToken = async (email, resettoken, resettoken_expiry) => {

  try {
    await db.query("BEGIN"); // Start the transaction

    const query = `
      UPDATE deliverypartners 
      SET dpartner_resettoken = $2, dpartner_resettoken_expiry = $3, 
          dpartner_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false
      RETURNING *;
    `;

    // Execute the update query
    const result = await db.query(query, [
      email,
      resettoken,
      resettoken_expiry,
    ]);

    // Check if the result is empty (no records were updated)
    if (result.rows.length === 0) {
      await db.query("ROLLBACK"); 
      return Response(
        false,
        "No delivery partner found with the provided email or user is deleted."
      );
    }

    await db.query("COMMIT"); 
    return Response(true, "Reset token updated successfully", result.rows[0]); 

  } catch (error) {
    await db.query("ROLLBACK"); 
    console.error("Error updating reset token:", error); 
    return Response(false, "Error during reset token update.", [], error.message);
  } 
};


// Update password
export const updatePassword = async (email, password) => {
   
  try {
    await db.query("BEGIN"); // Start the transaction
    const query = `
      UPDATE deliverypartners 
      SET dpartner_password = $2, 
          dpartner_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 
          dpartner_resettoken = null, 
          dpartner_resettoken_expiry = null
      WHERE dpartner_email = $1 AND dpartner_is_deleted=false
      RETURNING *;
    `;

    const result = await db.query(query, [email, password]);

    if (result.rows.length === 0) {
      await db.query("ROLLBACK"); 
      return Response(false, "No delivery partner found or user is deleted.");
    }

    await db.query("COMMIT"); 
    return Response(true, "Password updated successfully", result.rows[0]); // Return success with updated row
  } catch (error) {
    await db.query("ROLLBACK"); 
    console.error("Error updating password:", error);
    return Response(false, "Error during password update.", [], error.message); // Return error response
  } 
};


// Get all delivery partners
export const getAllDpartner = async () => {
  try {
    const query = `SELECT * FROM deliverypartners WHERE dpartner_is_deleted=false`;
    const result = await db.query(query);

    if (result.rows.length === 0) {
      return Response(false, "No delivery partners found.");
    }

    return Response(true, "Delivery partners fetched successfully", result.rows);
  } catch (error) {
    console.error("Error fetching delivery partners:", error);
    return Response(
      false,
      "Error during fetching delivery partners.",
      [],
      error.message
    ); 
  }
};


// Get one delivery partner by ID
export const getDpartnerById = async (id) => {
  try {
    const query = `SELECT dp.id, dp.dpartner_email, dp.dpartner_isverify, dp.dpartner_licence_number, c.city_name, c.city_state_name 
                   FROM deliverypartners dp 
                   JOIN cities c ON dp.dpartner_city_id = c.id 
                   WHERE dp.id = $1 AND dp.dpartner_is_deleted=false`;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return Response(false, "Delivery partner not found.");
    }

    return Response(true, "Delivery partner fetched successfully", result.rows[0]);
  } catch (error) {
    console.error("Error fetching delivery partner by ID:", error);
    return Response(
      0,
      "Error during fetching delivery partner by ID.",
      [],
      error.message
    ); 
  }
};


// Update delivery partner profile
export const updateDpartnerProfile = async (id, phone, name) => {
  try {
    await db.query("BEGIN")
    const query = `
      UPDATE deliverypartners 
      SET dpartner_name = $1, dpartner_phone = $2, dpartner_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $3 AND dpartner_is_deleted=false
      RETURNING *;
    `;
    const result = await db.query(query, [name, phone, id]);

    if (result.rows.length === 0) {
       await db.query("ROLLBACK");
      return Response(false, "Error updating profile.");
    }
 await db.query("COMMIT");
    return Response(true, "Profile updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
     await db.query("ROLLBACK");
    return Response(false, "Error during updating profile.", [], error.message); // Return error
  }
};


// Delete delivery partner
export const dpartnerProfileDelete = async (id) => {
   
  try {
    await db.query("BEGIN"); // Start the transaction

    const query = `
      UPDATE deliverypartners 
      SET dpartner_is_deleted = true, dpartner_updated_on = CURRENT_TIMESTAMP  
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      await db.query("ROLLBACK"); 
      return Response(false, "No delivery partner found with the provided ID.");
    }

    await db.query("COMMIT");
    return Response(true, "Profile deleted successfully", result.rows[0]); 
  } catch (error) {
    await db.query("ROLLBACK"); 
    console.error("Error deleting profile:", error);
    return Response(false, "Error during deleting partner.", [], error.message); // Return error response
  } 
};


// Get available delivery partners from the database
export const getAvailableDPartners = async () => {
  try {
    const query = `
      SELECT * FROM deliverypartners 
      WHERE dpartner_isavailable = true AND dpartner_is_deleted = false;
    `;
    const result = await db.query(query);

    if (result.rows.length === 0) {
      return Response(false, "No available delivery partners.");
    }

    return Response(
      true,
      "Available delivery partners fetched successfully",
      result.rows
    );
  } catch (error) {
    console.error("Error fetching available delivery partners:", error);
    return Response(0, "Error during availability check.", [], error.message); // Return error
  }
};

// Function to set the delivery partner as available again
export const setdPartnerAvailable = async (dpartnerId, isAvailable) => {
  try {
    await db.query("BEGIN")
    const query = `
      UPDATE deliverypartners 
      SET dpartner_isavailable = $2, dpartner_updated_on = CURRENT_TIMESTAMP  
      WHERE id = $1 AND dpartner_is_deleted = false
      RETURNING *;
    `;
    const result = await db.query(query, [dpartnerId, isAvailable]);

    if (result.rows.length === 0) {
       await db.query("ROLLBACK");
      return Response(false, "Failed to update availability of delivery partner.");
    }
       await db.query("COMMIT");
    
    return Response(true, "Successfully updated availability", result.rows[0]);
  } catch (error) {
    console.error("Error setting partner availability:", error);
    return Response(
      false,
      "Error during setting partner availability.",
      [],
      error.message
    ); 
  }
};


// check delivery partner available or not

export const checkDpartnerAvailability = async (dpartnerId) => {
  try {
    const query = `
      SELECT dpartner_isavailable 
      FROM deliverypartners 
      WHERE id = $1 AND dpartner_is_deleted = false;
    `;
    const result = await db.query(query, [dpartnerId]);

    if (result.rows.length === 0) {
      return Response(false, "Delivery partner not found.");
    }

    const isAvailable = result.rows[0].dpartner_isavailable;

    return Response(
      true,
      isAvailable
        ? "Delivery partner is available."
        : "Delivery partner is not available.",
      {
        isAvailable,
      }
    );
  } catch (error) {
    console.error("Error checking partner availability:", error);
    return Response(false, "Error during availability check.", [], error.message); // Return error response
  }
};
