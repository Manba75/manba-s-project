import { Server } from "socket.io";
import {
  updateOrderStatus,
  // getAvailableDeliveryPartners,
  getCustomerEmailByOrderId,
  saveOTP
} from "../models/orderModel.js";
import { checkDpartnerAvailability } from "../models/deliveryPartnerModel.js";
import { sendOrderOTPMail } from "../helpers/sendMail.js";
import { generateOTP } from "../helpers/generateOTP.js";

let io;
const activeOrders = {}; // Stores the orderId -> deliveryPartnerSocketId mapping
const availablePartners = new Set(); // Track available delivery partners

const initSocket = (server) => {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("New delivery partner connected:", socket.id);

    // Add new partner to available pool
    availablePartners.add(socket.id);
    console.log(`Available Partners: ${[...availablePartners]}`);

    // Broadcast new orders to available delivery partners
    socket.on("join_delivery", async (dpartnerId) => {
      socket.dpartnerId = dpartnerId;
      socket.join("available_partners");
    });

    // Listen for Order Response (Accept or Reject)
    socket.on("order_response", async ({ orderId, status, dpartnerId }) => {
      if (!orderId || !status || !dpartnerId) {
        return socket.emit("error", {
          message: "Invalid order response data.",
        });
      }

      try {
        if (status === "accepted") {
          // Ensure only one delivery partner gets assigned
          if (activeOrders[orderId]) {
            return socket.emit("error", {
              message: "Order already accepted by another partner.",
            });
          }

          // Update order status to accepted in DB
          const result = await updateOrderStatus(
            orderId,
            "accepted",
            dpartnerId
          );
          if (!result.success) {
            return socket.emit("error", { message: result.message });
          }

          activeOrders[orderId] = socket.id; // Assign order to this partner

          // Notify customer about order acceptance
          io.to(`customer-${orderId}`).emit("order_status_update", {
            orderId,
            status: "accepted",
            message: "Your order has been accepted by a delivery partner.",
          });

          // Notify other delivery partners that the order is taken
          io.to("available_partners").emit("order_status_update", {
            orderId,
            status: "rejected",
            message: "Order already accepted by another partner.",
          });

          // Remove assigned partner from available pool
          availablePartners.delete(socket.id);
        }

        if (status === "picked-up") {
          // Generate OTP for customer verification
          const otp = generateOTP();
          await saveOTP(orderId, otp);
          const email = await getCustomerEmailByOrderId(orderId);
          sendOrderOTPMail(orderId, email, otp);

          // Notify customer for OTP verification
          io.to(`customer-${orderId}`).emit("order_status_update", {
            orderId,
            status,
            message: "Please verify pickup using the OTP sent to your email.",
          });
        }

        if (status === "in-progress") {
          io.to(activeOrders[orderId]).emit("order_status_update", {
            orderId,
            status,
            message: "Your delivery is on the way.",
          });
        }

        if (status === "delivered") {
          delete activeOrders[orderId]; // Free up the order slot

          // Notify system that delivery partner is available again
          io.emit("delivery_partner_available", {
            dpartnerId,
            message: "Delivery partner is now available for new orders.",
          });

          // Add delivery partner back to available pool
          availablePartners.add(socket.id);
        }
      } catch (error) {
        console.error("Error processing order response:", error);
        socket.emit("error", { message: "Error processing your request." });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Delivery partner disconnected:", socket.id);
      availablePartners.delete(socket.id);

      // Remove partner from active orders
      Object.keys(activeOrders).forEach((orderId) => {
        if (activeOrders[orderId] === socket.id) {
          delete activeOrders[orderId];
        }
      });

      console.log(`Updated Available Partners: ${[...availablePartners]}`);
    });
  });
};

export { initSocket, io };
