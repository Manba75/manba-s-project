import formatResponse from "../helpers/formateResponse.js";
import { checkEmail,  getDpartnerById } from "../models/deliveryPartnerModel.js";
import { findUserByEmail, findUserById } from "../models/usermodel.js";
import jwt from "jsonwebtoken";
export const authenticate = async (req, res, next) => {
  let token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  // console.log("Token:", token);

  if (!token) {
    return res.status(401).json(formatResponse(0,"missing tokon"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json(formatResponse(0, "invalid tokon"));
    }

    // Fetch user by ID (Use `await`)
    const user = await findUserById(decoded.id);
    // const user= await findUserByEmail(decoded.cust_email)
    // console.log("User:", user);

    if (!user) {
      return res.status(401).json(formatResponse(0, "user not found"));
    }

    req.user = user; // Attach user to request
    // console.log("Authenticated User:", user);
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json(formatResponse(0,"unauthorized"));
  }
};

export const dpartnerAuthenticate= async(req,res,next)=>{
 let token = req.cookies.token || req.headers.authorization?.split(" ")[1];

//  console.log("Token:", token);

 if (!token) {
   return res.status(401).json(formatResponse(0, "missing tokon"));
 }

 try {
   const decoded = jwt.verify(token, process.env.JWT_SECRET);

   if (!decoded || !decoded.id) {
     return res.status(401).json(formatResponse(0, "invalid tokon"));
   }

   // Fetch user by ID (Use `await`)
   const user = await getDpartnerById(decoded.id);
   
  //  console.log("User:", user);

   if (!user) {
     return res.status(401).json(formatResponse(0, "user not found"));
   }

   req.user = user; // Attach user to request
  //  console.log("Authenticated User:", user);
   next();
 } catch (error) {
   console.error("Token verification error:", error);
   return res.status(401).json(formatResponse(0, "unauthorized"));
 }
}
