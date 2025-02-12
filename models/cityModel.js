import db from "../config/db.js";
import { Response } from "../helpers/Response.js";

/**
 * Check if a city exists.
 */
export const checkCity = async (city) => {
  try {
    const checkQuery = "SELECT * FROM cities WHERE city_name = $1";
    const checkResult = await db.query(checkQuery, [city]);

    if (checkResult.rows.length === 0) {
      return Response(false, "City not found");
    } 
    return Response(true, "City found", checkResult.rows[0]);
  } catch (error) {
    return Response(false, "Error checking city",[], error.message);
  }
};

/**
 * Insert a new city (Ensuring city uniqueness).
*/
export const insertCity = async (city, state, createdIp) => {
  try {
    // Check if city already exists
     await db.query("BEGIN")
    const checkQuery = "SELECT * FROM cities WHERE city_name = $1 AND city_state_name = $2";
    const checkResult = await db.query(checkQuery, [city, state]);

    if (checkResult.rows.length > 0) {
       await db.query("ROLLBACK");
      return Response(false, "City already exists in this state.");
    }

    const cityQuery = `
      INSERT INTO cities (city_name, city_state_name, city_created_on, city_updated_on, city_created_ip) 
      VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $3) RETURNING *;
    `;

    const cityResult = await db.query(cityQuery, [city, state, createdIp]);

    if (cityResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return Response(false, "Failed to insert city.");
    }
   await db.query("COMMIT");
    return Response(true, "City added successfully", cityResult.rows[0]);
  } catch (error) {
    await db.query("ROLLBACK");
    return Response(false, "Error inserting city", [], error.message);
  }
};

/**
 * Get city by ID.
 */
export const getCityById = async (id) => {
  try {
    const cityQuery = "SELECT * FROM cities WHERE id=$1";
    const cityResult = await db.query(cityQuery, [id]);

    if (cityResult.rows.length === 0) {
      return Response(false, `No city found with ID ${id}`);
    }

    return Response(true, "City found", cityResult.rows[0]);
  } catch (error) {
    return Response(false, "Error fetching city by ID", [], error.message);
  }
};

/**
 * Get all cities.
 */
export const getAllCity = async () => {
  try {
    const cityQuery = "SELECT * FROM cities WHERE is_deleted = FALSE";
    const cityResult = await db.query(cityQuery);

    if (cityResult.rows.length === 0) {
      return Response(false, "No cities found.");
    }

    return Response(true, "Cities fetched successfully", cityResult.rows);
  } catch (error) {
    return Response(false, "Error fetching all cities", [], error.message);
  }
};

/**
 * Get city ID by name.
 */
export const getCityIdByCityName = async (city) => {
  try {
    const cityQuery = "SELECT * FROM cities WHERE city_name = $1";
    const cityResult = await db.query(cityQuery, [city]);

    if (cityResult.rows.length === 0) {
      return Response(false, "City not found.");
    }
    const cityid=cityResult.rows[0].id
    return Response(true, "City ID found",cityid );
  } catch (error) {
    return Response(false, "Error fetching city ID",[], error.message);
  }
};

/**
 * Get city details by city_id.
 */
// export const getCityDetails = async (city_id) => {
//   try {
//     await db.query("BEGIN");
//     const cityQuery = "SELECT id, city_name, city_state_name FROM cities WHERE id = $1";
//     const cityResult = await db.query(cityQuery, [city_id]);

//     if (cityResult.rows.length === 0) {
//       await db.query("ROLLBACK");
//       return Response(false, "City not found.");
//     }

//     await db.query("COMMIT");
//     return Response(true, "City details fetched successfully", cityResult.rows[0]);
//   } catch (error) {
//     await db.query("ROLLBACK");
//     return Response(false, "Error fetching city details", [], error.message);
//   }
// };

/**
 * Update city details.
 */
export const updateCity = async (id, city, state) => {
  try {
    await db.query("BEGIN");

    // Check if city already exists
    const checkQuery = `
      SELECT * FROM cities WHERE city_name = $1 AND city_state_name = $2 AND id <> $3 AND is_deleted = FALSE;
    `;
    const checkResult = await db.query(checkQuery, [city, state, id]);

    if (checkResult.rowCount > 0) {
      await db.query("ROLLBACK");
      return Response(false, "City with the same name and state already exists.");
    }

    // Update city if not found in duplicates
    const updateQuery = `
      UPDATE cities 
      SET city_name = $1, city_state_name = $2, city_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $3 AND is_deleted = FALSE RETURNING *;
    `;

    const updateResult = await db.query(updateQuery, [city, state, id]);

    if (updateResult.rowCount === 0) {
      await db.query("ROLLBACK");
      return Response(false, `No city found with ID ${id}`);
    }

    await db.query("COMMIT");
    return Response(true, "City updated successfully", updateResult.rows[0]);
  } catch (error) {
    await db.query("ROLLBACK");
    return Response(false, "Error updating city", [], error.message);
  }
};

/**
 * Soft delete city.
 */
export const deleteCity = async (id) => {
  try {
    const deleteQuery = `
      UPDATE cities 
      SET is_deleted = TRUE, city_updated_on = CURRENT_TIMESTAMP 
      WHERE id = $1 RETURNING *;
    `;

    const deleteResult = await db.query(deleteQuery, [id]);

    if (deleteResult.rowCount === 0) {
      return Response(false, `No city found with ID ${id}`);
    }

    return Response(true, "City deleted successfully", deleteResult.rows[0]);
  } catch (error) {
    return Response(false, "Error deleting city",[], error.message);
  }
};

