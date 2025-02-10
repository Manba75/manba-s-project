import db from "../config/db.js";
import { errorResponse } from "../helpers/errorResponse.js";
export const checkCity = async (city) => {
  try {
    const checkQuery = "SELECT * FROM cities WHERE city_name = $1 ";
    const checkResult = await db.query(checkQuery, [city]);

    if (checkResult.rows.length > 0) {
      return checkResult.rows[0];
    }
  } catch (error) {
    return errorResponse("Error checking city", error);
  }
};

export const insertCity = async (city, state, createdIp) => {
  try {
    const cityQuery =
      "INSERT INTO cities(city_name, city_state_name, city_created_on, city_updated_on, city_created_ip) VALUES($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3) RETURNING *";

    const cityResult = await db.query(cityQuery, [city, state, createdIp]);

    if (cityResult.rows.length === 0) {
      return null;
    }

    return cityResult.rows[0];
  } catch (error) {
    return errorResponse("Error inserting city", error);
  }
};

export const getCityById = async (id) => {
  try {
    const cityQuery = "SELECT * FROM cities WHERE id=$1";
    const cityResult = await db.query(cityQuery, [id]);

    if (cityResult.rows.length === 0) {
      return null; 
    }

    return cityResult.rows[0]; 
  } catch (error) {
    console.error("Database error:", error); //
    throw new Error("Error fetching city by ID"); 
  }
};


export const getAllCity = async () => {
  try {
    const cityQuery = "SELECT * FROM cities ";
    const cityResult = await db.query(cityQuery, []);
    if (cityResult.rows.length === 0) {
      return null;
    }
    return cityResult.rows;
  } catch (error) {
    return errorResponse("Error fetching all cities", error);
  }
};

export const getCityId = async (city) => {
  try {
    const cityQuery = "SELECT id FROM cities WHERE city_name = $1 ";
    const cityResult = await db.query(cityQuery, [city]);

    if (cityResult.rows.length === 0) {
      return errorResponse("City not found");
    }

    return cityResult.rows[0].id;
  } catch (error) {
    return errorResponse("Error fetching city ID", error.message);
  }
};

// Fetch City Name and State Name from city_id
export const getCityDetails = async (city_id) => {
  try {
    await db.query("BEGIN");
    const cityQuery =
      "SELECT id,city_name, city_state_name FROM cities WHERE id = $1 ";
    const cityResult = await db.query(cityQuery, [city_id]);

    if (cityResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return errorResponse("City not found");
    } else {
      await db.query("COMMIT");
      return cityResult.rows[0];
    }
  } catch (error) {
    await db.query("ROLLBACK");
    return errorResponse("Error fetching city details", error);
  }
};

//updated city
// Update City
export const updateCity = async (id, city, state) => {
  try {
    await db.query("BEGIN"); // Start transaction

    // Check if the city with the same name and state already exists (excluding the current ID)
    const checkQuery = `
      SELECT * FROM cities 
      WHERE city_name = $1 AND city_state_name = $2 AND id <> $3 AND is_deleted = FALSE;
    `;
    const checkResult = await db.query(checkQuery, [city, state, id]);

    if (checkResult.rowCount > 0) {
       return errorResponse(false, "City with the same name and state already exists.");
    
    }

    // Proceed with updating the city if it doesn't exist
    const updateQuery = `
      UPDATE cities 
      SET city_name = $1, city_state_name = $2, city_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $3 AND is_deleted = FALSE RETURNING *;
    `;

    const updateResult = await db.query(updateQuery, [city, state, id]);

    if (updateResult.rowCount === 0) {
      throw new Error(`No city found with ID ${id}`);
    }

    await db.query("COMMIT"); // Commit transaction
    return errorResponse(true, updateResult.rows[0]);
  } catch (error) {
    await db.query("ROLLBACK"); // Rollback transaction if any error occurs
    return errorResponse("Error updating city", error.message);
  }
};

// Soft Delete City
export const deleteCity = async (id) => {
  try {
    const deleteQuery = `
      UPDATE cities 
      SET is_deleted = TRUE, city_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $1 RETURNING *;
    `;

    const deleteResult = await db.query(deleteQuery, [id]);

    if (deleteResult.rowCount === 0) {
      throw new Error(`No city found with ID ${id}`);
    }

    return deleteResult.rows[0];
  } catch (error) {
    return errorResponse("Error deleting city", error);
  }
};

