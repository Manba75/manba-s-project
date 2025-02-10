import { transporter } from "../config/nodemailer.js";

 export const sendOTPMail= async( email ,otp)=>{
 await transporter.sendMail({
   from: process.env.USER_EMAIL,
   to: email,
   subject: "Email Verification OTP",
   text: `Your OTP is: ${otp}. It is valid for 10 minutes.`,
 });
}

export const sendResetLink =async(email ,resetlink)=>{
 await transporter.sendMail({
   from: process.env.USER_EMAIL,
   to: email,
   subject: "Forgot password link",
   text: `Your  reset Link  is: ${resetlink}. It is valid for 1 hours.`,
 });
}


export const sendOrderOTPMail = async (orderId,email, otp) => {
  await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to: email,
    subject: "Order Verification OTP",
    html: `
      <h1>Order Verification</h1>
      <p>Dear Customer,</p>
      <p>Your order with ID <strong>#${orderId}</strong> has been delivered!</p>
      <p>Please verify your order using the OTP (One-Time Password) below:</p>
      <p><strong>OTP: ${otp}</strong></p>
      <p>Enter the OTP on our platform to complete the verification process.</p>
      <p>If you did not place this order, please contact our support team immediately.</p>
      <br/>
      <p>Best regards,</p>
      <p>Your Company Name</p>
    `,
  });
};