import db from "../config/db.js";
import { errorResponse } from "../helpers/errorResponse.js";
// Set Time Zone for PostgreSQL Connection
await db.query("SET TIME ZONE 'Asia/Kolkata';");

// Create User Query
const createCustomer = async (email, password, otp, createdIP) => {
  try {
    const query = `
      INSERT INTO customers (
        cust_email, cust_password, cust_isverify, cust_verifyotp, 
        cust_expiryotp, cust_created_on, cust_updated_on, cust_created_ip
      )
      VALUES (
        $1, $2, $3, $4, 
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata' + INTERVAL '10 minutes', 
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 
        CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 
        $5::TEXT
      )
      RETURNING *;
    `;
    const result = await db.query(query, [
      email,
      password,
      false,
      otp,
      createdIP,
    ]);
    if (!result) {
      return errorResponse("Failed to create customer");
    }
    return result.rows[0];
  } catch (error) {
    console.error("User creation failed:", error);
    return errorResponse("Error creating customer", error);
  }
};

// Find User By Email
const findUserByEmail = async (email) => {
  try {
    const query = `
      UPDATE customers
      SET cust_last_login = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE cust_email = $1
      RETURNING *;
    `;
    const result = await db.query(query, [email]);
    return result.rows[0];
  } catch (error) {
    console.error("Finding email error:", error);
    return errorResponse("Error finding user by email", error);
  }
};

// Find Email for OTP Verification
const findVerifyEmail = async (email) => {
  try {
    const query = `
      SELECT * 
      FROM customers 
      WHERE cust_email = $1   ;
    `;
    const result = await db.query(query, [email]);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Error retrieving user:", error);
    return errorResponse("Error fetching OTP verification details", error);
  }
};

// Update OTP
const updateOTP = async (email, otp, expiryotp) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_verifyotp = $2, cust_expiryotp = $3, cust_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE cust_email = $1;
    `;
    const result = await db.query(query, [email, otp, expiryotp]);

    if (result.rowCount === 0) {
      return errorResponse("User not found or OTP not updated.");
    }

    return { success: true, message: "OTP updated successfully" };
  } catch (error) {
    console.error("Error updating OTP:", error);
    return errorResponse("Error updating OTP", error.message);
  }
};

// Verify User OTP
const verifyUserOTP = async (email) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_isverify = TRUE, cust_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE cust_email = $1
      RETURNING *;
    `;

    const result = await db.query(query, [email]);

    if (result.rowCount === 0) {
      return errorResponse("User not found or OTP verification failed.");
    }

    return {
      success: true,
      message: "User verified successfully",
      data: result.rows[0],
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return errorResponse("Error verifying OTP", error.message);
  }
};

// Find User by ID
const findUserById = async (id) => {
  try {
    const query = "SELECT * FROM customers WHERE id = $1;";
    const result = await db.query(query, [id]);
    return result.rows.length ? result.rows[0] : null;
  } catch (error) {
    console.error("Fetching user by ID error:", error);
    return errorResponse("Error fetching user by ID", error);
  }
};

// Update Reset Token
const updateResetToken = async (email, resettoken, resettoken_expiry) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_resettoken = $2, cust_resettoken_expiry = $3, 
          cust_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE cust_email = $1
      RETURNING *;
    `;
    return await db.query(query, [email, resettoken, resettoken_expiry]);
  } catch (error) {
    console.error("Error updating reset token:", error);
    return errorResponse("Error updating reset token", error);
  }
};

// Get All Users
const getAllUser = async () => {
  try {
    const query = "SELECT * FROM customers WHERE is_deleted=false;";
    return await db.query(query, []);
  } catch (error) {
    console.error("Error fetching users:", error);
    return errorResponse("Error fetching all users", error);
  }
};

// Update Password & Clear Reset Token

const updatePassword = async (email, password) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_password = $2, 
          cust_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 
          cust_resettoken = NULL, 
          cust_resettoken_expiry = NULL
      WHERE cust_email = $1
      RETURNING *;
    `;
    return await db.query(query, [email, password]);
  } catch (error) {
    console.error("Error updating password:", error);
    return errorResponse("Error updating password", error);
  }
};

// Update Customer Profile
const updateUserProfile = async (id, name, phone) => {
  try {
    const query = `
      UPDATE customers 
      SET cust_name = $1, cust_phone = $2, cust_updated_on = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
      WHERE id = $3 AND is_deleted=false
      RETURNING *;
    `;
    const result = await db.query(query, [name, phone, id]);
    return result.rows[0];
  } catch (error) {
    console.error("Error updating profile:", error);
    return errorResponse("Error updating profile", error);
  }
};

// Delete User Profile
const deleteUserProfile = async (id) => {
  try {
    const query = `
      UPDATE customers SET is_deleted =true WHERE id = $1 RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rowCount === 0) {
      throw new Error(`No customer found with ID ${id}`);
    }
    const deleteResult = result.rows[0];
    return errorResponse(true, " success", deleteResult);
  } catch (error) {
    console.error("Error deleting profile:", error);
    return errorResponse("Error deleting user profile", error);
  }
};

export {
  findUserByEmail,
  createCustomer,
  findVerifyEmail,
  updateOTP,
  verifyUserOTP,
  findUserById,
  updateResetToken,
  updatePassword,
  updateUserProfile,
  getAllUser,
  deleteUserProfile,
};
