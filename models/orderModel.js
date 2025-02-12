import db from "../config/db.js";
import { Response } from "../helpers/Response.js";
import { getCityById, getCityIdByCityName } from "./cityModel.js";
// import  {savedAddress } from "../helpers/getLatLong.js";
import axios from "axios";
export const orderPlace = async (
  cust_id,
  vehicletype,
  pickup,
  drop,
  order_charge,
  createdIp
) => {
  try {
    // Start the transaction
    await db.query("BEGIN");

    const pickup_city_id = await getCityIdByCityName(pickup.city);
    const drop_city_id = await getCityIdByCityName(drop.city);
    console.log("d", pickup_city_id);

    if (!pickup_city_id || !drop_city_id) {
      await db.query("ROLLBACK");
      return { success: false, message: "City ID not found." };
    }

    // Insert Pickup Address
    const pickupQuery = `
      INSERT INTO address (
        address_city_id, cust_id, address_type, address_street, address_flatno,
        address_landmark, address_pincode, address_phone, address_longitude, address_latitude,
        address_created_on,address_updated_on, address_created_ip
      ) 
      VALUES ($1, $2, 'pickup', $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,$10) 
      RETURNING id;
    `;
    const pickupResult = await db.query(pickupQuery, [
      pickup_city_id,
      cust_id,
      pickup.street,
      pickup.flatno,
      pickup.landmark,
      pickup.pincode,
      pickup.phone,
      pickup.longitude,
      pickup.latitude,
      createdIp,
    ]);
    if (pickupResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return { success: false, message: "Failed to insert pickup address." };
    }
    const pickup_id = pickupResult.rows[0].id;

    // Insert Drop Address
    const dropQuery = `
      INSERT INTO address (
        address_city_id, cust_id, address_type, address_street, address_flatno,
        address_landmark, address_pincode, address_phone, address_longitude, address_latitude,
        address_created_on,address_updated_on, address_created_ip
      ) 
      VALUES ($1, $2, 'drop', $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10) 
      RETURNING id;
    `;
    const dropResult = await db.query(dropQuery, [
      drop_city_id,
      cust_id,
      drop.street,
      drop.flatno,
      drop.landmark,
      drop.pincode,
      drop.phone,
      drop.longitude,
      drop.latitude,
      createdIp,
    ]);
    if (dropResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return { success: false, message: "Failed to insert drop address." };
    }
    const drop_id = dropResult.rows[0].id;

    // Insert Order
    const insertOrder = `
      INSERT INTO orders (
        cust_id, pickup_address_id, drop_address_id, vehicle_type_id, order_date, order_status, 
        order_delivery_charge, order_pickup_flatno, order_pickup_street, 
        order_pickup_landmark, order_pickup_pincode, order_pickup_phone, order_pickup_city, order_pickup_state, 
        order_pickup_latitude, order_pickup_longitude, 
        order_drop_flatno, order_drop_street, order_drop_landmark, 
        order_drop_pincode, order_drop_phone, order_drop_city, order_drop_state, 
        order_drop_latitude, order_drop_longitude, 
        order_created_on, order_updated_on, order_created_ip
      ) VALUES (
        $1, $2, $3, $4, CURRENT_DATE, 'pending', 
        $5, $6, $7, $8, $9, $10, $11, $12, $13, 
        $14, $15, $16, $17, $18, $19, $20, $21, 
        $22, $23, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $24
      ) RETURNING *;
    `;
    const orderResult = await db.query(insertOrder, [
      cust_id,
      pickup_id,
      drop_id,
      vehicletype,
      order_charge,
      pickup.flatno,
      pickup.street,
      pickup.landmark,
      pickup.pincode,
      pickup.phone,
      pickup.city,
      pickup.state,
      pickup.longitude,
      pickup.latitude,
      drop.flatno,
      drop.street,
      drop.landmark,
      drop.pincode,
      drop.phone,
      drop.city,
      drop.state,
      drop.longitude,
      drop.latitude,
      createdIp,
    ]);
    if (orderResult.rows.length === 0) {
      await db.query("ROLLBACK");
      return { success: false, message: "Failed to create the order." };
    }

    await db.query("COMMIT");

    return { success: true, order: orderResult.rows[0] };
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Order Placement Error:", error);
    return {
      success: false,
      message: "Order placement failed due to an unexpected error.",
      error: error.message,
    };
  }
};

export const updateOrderStatus = async (orderId, status, dpartnerId) => {

  try {
    await db.query("BEGIN"); // Start the transaction

    // Fetch the current order status
    const orderQuery = `SELECT order_status FROM orders WHERE id = $1`;
    const orderResult = await db.query(orderQuery, [orderId]);

    if (orderResult.rows.length === 0) {
      await db.query("ROLLBACK"); // Rollback transaction if order not found
      return {
        success: false,
        message: "Order not found.",
      };
    }

    const currentStatus = orderResult.rows[0].order_status;

    // Define locked statuses that cannot revert to previous status
    const lockedStatuses = ["accepted", "pickup", "in-progress", "delivered"];

    // If the current status is locked and the new status is "pending", return error
    if (lockedStatuses.includes(currentStatus) && status === "pending") {
      await db.query("ROLLBACK"); // Rollback transaction if invalid status transition
      return {
        success: false,
        message:
          "Once the status is updated to accepted, in-progress, or delivered, it cannot be reverted to pending.",
      };
    }

    // Define valid status transitions
    const validStatuses = [
      "accepted",
      "pickup",
      "in-progress",
      "delivered",
      "rejected",
    ];
    if (!validStatuses.includes(status)) {
      await db.query("ROLLBACK"); // Rollback transaction if invalid status
      return {
        success: false,
        message: "Invalid status transition.",
      };
    }

    // Update the order status if valid
    const updateQuery = `
      UPDATE orders
      SET order_status = $1, dpartner_id = $2
      WHERE id = $3
      RETURNING *;
    `;

    const result = await db.query(updateQuery, [
      status,
      dpartnerId,
      orderId,
    ]);

    // Check if the update was successful
    if (result.rows.length === 0) {
      await db.query("ROLLBACK"); // Rollback transaction if update failed
      return {
        success: false,
        message: "Order not found or status unchanged.",
      };
    }

    const order = result.rows[0];

    await db.query("COMMIT"); // Commit the transaction if everything is successful

    return {
      success: true,
      message: "Order status updated successfully.",
      order,
    };
  } catch (error) {
    await db.query("ROLLBACK"); // Rollback transaction on any error
    console.error("Error updating order status:", error);
    return {
      success: false,
      message: "Database error while updating order status.",
      error: error.message,
    };
  } 
};


//get email of user
export const getCustomerEmailByOrderId = async (orderId) => {
  try {
    const query = `
      SELECT c.cust_email
      FROM orders o
      JOIN customers c ON o.cust_id = c.id
      WHERE o.id = $1;
    `;

    const result = await db.query(query, [orderId]);

    // Check if an email was found
    if (result.rows.length > 0) {
      return {
        success: true,
        email: result.rows[0].email,
      };
    } else {
      console.log("Order not found or customer email not found.");
      return {
        success: true,
        message: "Database error while email fetching.",
      };
    }
  } catch (err) {
    console.error("Error fetching customer email:", err);
    return {
      success: false,
      message: "Database error while updating order email.",
      error: err.message,
    };
  }
};

//get user by order Id

export const getUserByOrderId = async (orderId) => {
  try {
    const query = "SELECT cust_id FROM orders WHERE id=$1";
    const result = await db.query(query, [orderId]);
    if (result.rowCount === 0) {
      return Response(false, "order id is not found with customers");
    }
    const getResult = result.rows[0];
    return Response(true, "success get custid ", getResult);
  } catch (error) {
    console.error("Error:", error);
    return Response(
      false,
      "Error fetching customer from database in order table"
    );
  }
};

// save OTP
export const saveOTP = async (orderId, otp) => {
  try {
    const saveOTPQuery = `UPDATE orders
SET order_verifyotp = $2, order_expiryotp = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
WHERE id = $1
RETURNING *`;
    const saveOTPResult = await db.query(saveOTPQuery, [
      orderId,
      otp
    ]);

    if (saveOTPResult.rowCount === 0) {
      return Response(false, "save otp error");
    }
    const result = saveOTPResult.rows[0];
    return Response(true, "save otp success", result);
  } catch (error) {
    console.error("Error updating order status:", error);
    return Response(
      false,
      "Error fetching customer from database in order table"
    );
  }
};

// get order

export const getOrderById = async (id) => {
  try {
    // Query to get the order by ID
    const getOrderQuery = "SELECT * FROM orders WHERE id = $1  ";
    const getOrderResult = await db.query(getOrderQuery, [id]);

    // Check if order exists
    if (getOrderResult.rows.length === 0) {
      return { success: false, message: "Order not found." };
    }
  const result = getOrderResult.rows[0];
    // Return the order data
    return { success: true, result };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return {
      success: false,
      message: "Order retrieval failed due to an unexpected error.",
      error: error.message,
    };
  }
};

//get all order

export const getAllOrder = async () => {
  try {
    // Query to get the order by ID
    const getOrderQuery = "SELECT * FROM orders  ";
    const getOrderResult = await db.query(getOrderQuery, []);

    // Check if order exists
    if (getOrderResult.rows.length === 0) {
      return { success: false, message: "Orders not found." };
    }
    const order = getOrderResult.rows;
    // Return the order data
    return { success: true, order };
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return {
      success: false,
      message: "Order retrieval failed due to an unexpected error.",
      error: error.message,
    };
  }
};
