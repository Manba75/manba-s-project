import db from "../config/db.js";
import requestIp from "request-ip";
import {
  getAllOrder,
  getOrderById,
  orderPlace,
  updateOrderStatus,
  saveOTP,
  getCustomerEmailByOrderId,
} from "../models/orderModel.js";
import formatResponse from "../helpers/formateResponse.js";
import { findUserByEmail, findUserById } from "../models/usermodel.js";
import { orderPlaceValidation } from "../middleware/validation.js";
import { getVehicleTypeId } from "../models/vehicletypeModel.js";
import { getCityId, getCityDetails } from "../models/cityModel.js";
import {
  checkDpartnerAvailability,
  getDpartnerById,
  setdPartnerAvailable,
} from "../models/deliveryPartnerModel.js";
import { initSocket, io } from "./socketController.js";
import { generateOTP } from "../helpers/generateOTP.js";
import {  sendOrderOTPMail } from '../helpers/sendMail.js'

export const placeOrder = async (req, res) => {
  try {
    const { id } = req.user;
    console.log("User ID:", id);

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json(formatResponse(0, "User not found"));
    }

    const { vehicletype, pickup, drop, order_charge } = req.body;
    console.log("req", req.body);
    if (!vehicletype || !pickup || !drop || !order_charge) {
      return res.status(400).json(formatResponse(0, "All fields are required"));
    }

    const created_ip = requestIp.getClientIp(req);

    const pickupCityDetails = await getCityDetails(pickup.city_id);
    const dropCityDetails = await getCityDetails(drop.city_id);

    console.log("p", pickupCityDetails);
    if (!pickupCityDetails) {
      return res.status(400).json(formatResponse(0, "Pickup city not found."));
    }

    if (!dropCityDetails) {
      return res.status(400).json(formatResponse(0, "Drop city not found."));
    }

    //  Get Vehicle Type ID
    const vehicletype_id = await getVehicleTypeId(vehicletype);
    if (!vehicletype_id) {
      return res.status(400).json(formatResponse(0, "Vehicle type not found."));
    }

    // Place Order
    try {
      const order = await orderPlace(
        id,
        vehicletype_id,
        pickup,
        drop,
        order_charge,
        created_ip,
        pickupCityDetails.city_name,
        pickupCityDetails.city_state_name,
        dropCityDetails.city_name,
        dropCityDetails.city_state_name
      );

      if (!order || order.success === false) {
        return res
          .status(500)
          .json(formatResponse(0, "Order Placement Error", order?.error || ""));
      }

      io.emit("new_order", {
        orderId: order.id,
        pickup: order.pickup,
        drop: order.drop,
        custId: order.cust_id,
      });
      return res
        .status(200)
        .json(formatResponse(1, "Order placed successfully!", { order }));
    } catch (error) {
      console.error("Order Placement Error:", error);
      return res
        .status(500)
        .json(
          formatResponse(0, "Order placement failed.", { error: error.message })
        );
    }
  } catch (err) {
    console.error("Unexpected Error:", err);
    return res
      .status(500)
      .json(formatResponse(0, "Failed to place order", { error: err.message }));
  }
};

// updateOrder.js (Controller)
export const updateOrder = async (req, res) => {
  // const db = await db.connect();  // Start the transaction
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(400)
        .json(formatResponse(0, "User authentication failed."));
    }

    const dpartnerId = req.user.id;
    const { id: orderId } = req.params;
    const { status } = req.body;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json(formatResponse(0, "Invalid order ID."));
    }
    if (!status) {
      return res
        .status(400)
        .json(formatResponse(0, "Order status is required."));
    }

    // Check if User Exists
    const user = await getDpartnerById(dpartnerId);
    if (!user) {
      return res
        .status(404)
        .json(formatResponse(0, "Delivery partner not found."));
    }

    // checking dpartner availability
    const partnerAvailable = await checkDpartnerAvailability(dpartnerId);
    if (!partnerAvailable && status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "This delivery partner is not available to accept the order.",
      });
    }

    // Fetch Order Details Before Validation to Ensure Latest Status
    let order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json(formatResponse(0, "Order not found."));
    }
   console.log("order satus",order)
   


    // Validate Status Transition Before Update
    const validStatuses = ["pending","accepted","pickup", "in-progress", "delivered", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json(formatResponse(0,"Order  status invalid"));
    }

    // Proceed to Update the Order Status in DB After Validation
    const result = await updateOrderStatus(orderId, status, dpartnerId);
    if (!result.success) {
      await db.query("ROLLBACK");  // Ensure the rollback on failure
      return res.status(400).json(formatResponse(0, "order updated failed ."));
    }

    // Re-fetch the updated order
    order = result.order; 
    if (!order) {
      await db.query("ROLLBACK");
      return res.status(404).json(formatResponse(0, "Order not found after update."));
    }

    // Emit updates based on the status
    if (status === "accepted") {
      // io.to(`customer-${orderId}`).emit("order_status_update", {
      //   orderId,
      //   status,
      //   message: `Your order has been accepted by delivery partner ${dpartnerId}`,
      // });
      console.log("accepted",status)
       return res
         .status(200)
         .json(
           formatResponse(1, "Orderaccepted successfully", {
             orderId,
             status,
             result,
           })
         );
    } else if (status === "in-progress") {
      // io.to(`customer-${orderId}`).emit("order_status_update", {
      //   orderId,
      //   status,
      //   message: `Your order is on the way!`,
      // });
      return res.status(200).json(
        formatResponse(1, "Order is on the way", {
          orderId,
          status,
          cust:order.cust_id,
          dpartnerId:order.dpartner_id
        })
      );
    } 
    else if (status === "pickup") {
      const otp = generateOTP();
      await saveOTP(orderId, otp);
      const email = await getCustomerEmailByOrderId(orderId);
      sendOrderOTPMail(orderId, email, otp);

      // io.to(`customer-${orderId}`).emit("order_status_update", {
      //   orderId,
      //   status,
      //   message: `Your order has been delivered! Please verify using the OTP sent to you.`,
      // });

     
       return res.status(200).json(
         formatResponse(1, "order to pickup and verify otp", {
           orderId,
           status,
           cust: order.cust_id,
           dpartnerId: order.dpartner_id,
         })
       );
       }   
       else if (status === "delivered") {
      const otp = generateOTP();
      await saveOTP(orderId, otp);
      const email = await getCustomerEmailByOrderId(orderId);
      sendOrderOTPMail(orderId, email, otp);

      // io.to(`customer-${orderId}`).emit("order_status_update", {
      //   orderId,
      //   status,
      //   message: `Your order has been delivered! Please verify using the OTP sent to you.`,
      // });

  
      const availabilityUpdate = await setdPartnerAvailable(dpartnerId, true);
      if (!availabilityUpdate.success) {
        console.error("Failed to update delivery partner availability.");
         return res.status(400).json(formatResponse(0,"Failed to update delivery partner availability."))
      }

      // io.emit("delivery_partner_available", {
      //   dpartnerId,
      //   message: `Delivery partner ${dpartnerId} is now available for new deliveries.`,
      // });
       return res.status(200).json(
         formatResponse(1, "order to deliverd", {
           orderId,
           status,
           cust: order.cust_id,
           dpartnerId: order.dpartner_id,
         })
       );
     
    
      }

      // io.emit("delivery_partner_available", {
      //   dpartnerId,
      //   message: `Delivery partner ${dpartnerId} is now available for new deliveries.`,
      // });
   
  
     else {
      // io.to(`customer-${orderId}`).emit("order_status_update", {
      //   orderId,
      //   status,
      //   message: `Order ${orderId} was rejected by delivery partner ${dpartnerId}`,
      // });

      // // return res.status(200).json(
      // //   formatResponse(1, "Order updated successfully", {
      // //     orderId,
      // //     status,
      // //     result,
      // //   })
      // );
      return res.status(400).json(
        formatResponse(1, "Order rejected ", {
          orderId,
          status,
          result,
        })
      );
    }

    await db.query("COMMIT");  // Commit the transaction if all is well

   return res.status(200).json(formatResponse(1, "Order updated successfully", { orderId, status, result }));
  } catch (error) {
    console.error("Unexpected Error:", error);
    await db.query("ROLLBACK");  // Rollback in case of error
    return res.status(500).json(formatResponse(0, "Failed to update order", { error: error.message }));
  } 
};


//  verify otp
export const verifyOTP=async (req,res)=>{
   try {
  

     //  Fetch Order Details
      const { id }=req.params;
      const {otp}=req.body;



     const Order = await getOrderById(id);

     console.log("getOrder:", Order);
    //  const { c_id ,order_verifyotp ,order_expiryotp}=Order;
     const email=await getCustomerEmailByOrderId(id)

     if (!Order || Order.success === false) {
       return res.status(400).json(formatResponse(0, "Failed to fetch order."));
     }
     if(otp!==Order.order_verifyotp)
     {
        return res.status(400).json(formatResponse(0,"otp invalid"))
     }
    const currentTime = new Date();
    const expiryTime = new Date(Order.order_expiryotp);

    if (currentTime > expiryTime) {
      await saveOTP(email, null, null);
      return res
        .status(400)
        .json(formatResponse(0, "OTP expired. Please resend OTP"));
    }
    

     //  Return Success Response
     return res
       .status(200)
       .json(formatResponse(1, "Order  successfully verify by user", Order));
   } catch (error) {
     console.error("Unexpected Error:", error);
     return res
       .status(500)
       .json(
         formatResponse(0, "Failed to verify order", { error: error.message })
       );
   }
}

export const getOneOrder = async (req, res) => {
  try {
    //  Validate User ID
    if (!req.user || !req.user.id) {
      return res
        .status(400)
        .json(formatResponse(0, "User authentication failed."));
    }

    const userId = req.user.id;
    console.log("User ID:", userId);

    //  Validate Order ID
    const { id: orderId } = req.params;
    if (!orderId || isNaN(orderId)) {
      return res.status(400).json(formatResponse(0, "Invalid order ID."));
    }

    //  Check if User Exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json(formatResponse(0, "User not found."));
    }

    //  Fetch Order Details
    const getOrder = await getOrderById(orderId);
    console.log("getOrder:", getOrder);

    if (!getOrder || getOrder.success === false) {
      return res.status(400).json(formatResponse(0, "Failed to fetch order."));
    }

    //  Return Success Response
    return res
      .status(200)
      .json(formatResponse(1, "Order retrieved successfully", getOrder.data));
  } catch (error) {
    console.error("Unexpected Error:", error);
    return res
      .status(500)
      .json(
        formatResponse(0, "Failed to retrieve order", { error: error.message })
      );
  }
};

export const getAllOrders = async (req, res) => {
  try {
    //  Validate User ID
    if (!req.user || !req.user.id) {
      return res
        .status(400)
        .json(formatResponse(0, "User authentication failed."));
    }

    const userId = req.user.id;
    console.log("User ID:", userId);

    //  Check if User Exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json(formatResponse(0, "User not found."));
    }

    //  Fetch Order Details
    const Order = await getAllOrder();
    console.log("getOrder:", Order);

    if (!Order || Order.success === false) {
      return res.status(400).json(formatResponse(0, "Failed to fetch order."));
    }

    //  Return Success Response
    return res
      .status(200)
      .json(formatResponse(1, "Order retrieved successfully", Order));
  } catch (error) {
    console.error("Unexpected Error:", error);
    return res
      .status(500)
      .json(
        formatResponse(0, "Failed to retrieve order", { error: error.message })
      );
  }
};
