import db from "../config/db.js";
import { Response } from "../helpers/Response.js";

// Set Time Zone for PostgreSQL Connection
await db.query("SET TIME ZONE 'Asia/Kolkata';");

// Create User Query
export const createCustomer = async (email, password, otp, createdIP) => {
  try {
    const checkQuery = `
      SELECT * FROM customers
      WHERE cust_email = $1;
    `;
    const existingUser = await db.query(checkQuery, [email]);

    if (existingUser.rowCount > 0) {
      const user = existingUser.rows[0];

      if (user.is_deleted) {
        // Reactivate soft-deleted user instead of inserting a new one
        const updateQuery = `
          UPDATE customers 
          SET 
            cust_password = $2, 
            cust_isverify = false, 
            cust_verifyotp = $3,
            cust_expiryotp = CURRENT_TIMESTAMP + INTERVAL '10 minutes', 
            cust_updated_on = CURRENT_TIMESTAMP, 
            cust_created_ip = $4, 
            is_deleted = false
          WHERE cust_email = $1
          RETURNING *;
        `;
        const updateResult = await db.query(updateQuery, [
          email,
          password,
          otp,
          createdIP,
        ]);

        if (updateResult.rowCount === 0) {
          return Response(false, "Failed to reactivate customer.");
        }
        return Response(
          true,
          "Customer reactivated successfully",
          updateResult.rows[0]
        );
      }

      // If user exists and is not deleted, return error
      return Response(false, "Email already exists");
    }

    // Insert new customer if the email is completely new
    const insertQuery = `
      INSERT INTO customers (
        cust_email, cust_password, cust_isverify, cust_verifyotp, 
        cust_expiryotp, cust_created_on, cust_updated_on, cust_created_ip, is_deleted
      )
      VALUES (
        $1, $2, $3, $4, 
        CURRENT_TIMESTAMP + INTERVAL '10 minutes', 
        CURRENT_TIMESTAMP, 
        CURRENT_TIMESTAMP, 
        $5, 
        false
      )
      RETURNING *;
    `;
    const insertResult = await db.query(insertQuery, [
      email,
      password,
      false,
      otp,
      createdIP,
    ]);

    if (insertResult.rowCount === 0) {
      return Response(false, "Failed to create customer");
    }

    return Response(
      true,
      "Customer created successfully",
      insertResult.rows[0]
    );
  } catch (error) {
    console.error("User creation failed:", error);
    return Response(false, "Error creating customer", [], error.message);
  }
};



// Find User By Email
export const findUserByEmail = async (email) => {
  try {
    const query = `
      SELECT * FROM customers
      WHERE cust_email = $1 ;
      
    `;
    const result = await db.query(query, [email]);

    if (result.rowCount === 0) {
      return Response(false, "User not found");
    }
    return Response(true, "User found", result.rows[0]);
  } catch (error) {
    console.error("Finding email error:", error);
    return Response(false, "Error finding user by email", [], error.message);
  }
};

export const updateLastLogin = async (email) => {
  try {
    const query = `
      UPDATE customers
      SET cust_last_login = CURRENT_TIMESTAMP
      WHERE cust_email = $1 AND is_deleted = false
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

// Find Email for OTP Verification
export const findVerifyEmail = async (email) => {
  try {
    const query = `SELECT * FROM customers WHERE cust_email = $1 AND is_deleted=false;`;
    const result = await db.query(query, [email]);

    if (result.rowCount === 0) {
      return Response(false, "Email not found for verification");
    }
    return Response(true, "Email found for verification", result.rows[0]);
  } catch (error) {
    console.error("Error retrieving user:", error);
    return Response(
      false,
      "Error fetching OTP verification details",
      [],
      error.message
    );
  }
};

// Update OTP
export const updateOTP = async (email, otp, expiryotp) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_verifyotp = $2, cust_expiryotp = $3, cust_updated_on = CURRENT_TIMESTAMP
      WHERE cust_email = $1
      RETURNING *;
    `;
    const result = await db.query(query, [email, otp, expiryotp]);

    if (result.rowCount === 0) {
      return Response(false, "User not found or OTP update failed.");
    }
    return Response(true, "OTP updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Error updating OTP:", error);
    return Response(false, "Error updating OTP", [], error.message);
  }
};

// Verify User OTP
export const verifyUserOTP = async (email) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_isverify = TRUE, cust_updated_on = CURRENT_TIMESTAMP
      WHERE cust_email = $1
      RETURNING *;
    `;

    const result = await db.query(query, [email]);

    if (result.rowCount === 0) {
      return Response(false, "User not found or OTP verification failed.");
    }
    return Response(true, "User verified successfully", result.rows[0]);
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return Response(false, "Error verifying OTP", [], error.message);
  }
};

// Find User by ID
export const findUserById = async (id) => {
  try {
    const query = "SELECT * FROM customers WHERE id = $1;";
    const result = await db.query(query, [id]);

    if (result.rowCount === 0) {
      return Response(false, "User not found");
    }
    return Response(true, "User found", result.rows[0]);
  } catch (error) {
    console.error("Fetching user by ID error:", error);
    return Response(false, "Error fetching user by ID", [], error.message);
  }
};

// Update Reset Token
export const updateResetToken = async (
  email,
  resettoken,
  resettoken_expiry
) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_resettoken = $2, cust_resettoken_expiry = $3, 
          cust_updated_on = CURRENT_TIMESTAMP
      WHERE cust_email = $1
      RETURNING *;
    `;
    const result = await db.query(query, [
      email,
      resettoken,
      resettoken_expiry,
    ]);

    if (result.rowCount === 0) {
      return Response(false, "User not found or reset token update failed.");
    }
    return Response(true, "Reset token updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Error updating reset token:", error);
    return Response(false, "Error updating reset token", [], error.message);
  }
};

// Get All Users
export const getAllUser = async () => {
  try {
    const query = "SELECT * FROM customers WHERE is_deleted=false;";
    const result = await db.query(query);

    if (result.rowCount === 0) {
      return Response(false, "No users found.");
    }
    return Response(true, "Users fetched successfully", result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response(false, "Error fetching all users", [], error.message);
  }
};

// Update Password & Clear Reset Token

export const updatePassword = async (email, password) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_password = $2, 
          cust_updated_on = CURRENT_TIMESTAMP, 
          cust_resettoken = null, 
          cust_resettoken_expiry = null
      WHERE cust_email = $1
      RETURNING *;
    `;
    const result = await db.query(query, [email, password]);

    if (result.rowCount === 0) {
      return Response(false, "User not found or password update failed.");
    }
    return Response(true, "Password updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Error updating password:", error);
    return Response(false, "Error updating password", [], error.message);
  }
};

// Update Customer Profile
export const updateUserProfile = async (id, name, phone) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_name = $1, cust_phone = $2, cust_updated_on = CURRENT_TIMESTAMP
      WHERE id = $3 AND is_deleted=false
      RETURNING *;
    `;
    const result = await db.query(query, [name, phone, id]);

    if (result.rowCount === 0) {
      return Response(false, "User not found or profile update failed.");
    }
    return Response(true, "Profile updated successfully", result.rows[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response(false, "Error updating profile", [], error.message);
  }
};

// Delete User Profile
export const deleteUserProfile = async (id) => {
  try {
    const query = `UPDATE customers SET is_deleted=true WHERE id = $1 RETURNING *;`;
    const result = await db.query(query, [id]);

    if (result.rowCount === 0) {
      return Response(false, `No customer found with ID ${id}`);
    }
    return Response(true, "User deleted successfully", result.rows[0]);
  } catch (error) {
    console.error("Error deleting profile:", error);
    return Response(false, "Error deleting user profile", [], error.message);
  }
};
