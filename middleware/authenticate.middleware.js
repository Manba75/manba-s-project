import formatResponse from "../helpers/formateResponse.js";
import { checkEmail,  getDpartnerById } from "../models/deliveryPartnerModel.js";
import { findUserByEmail, findUserById } from "../models/usermodel.js";
import jwt from "jsonwebtoken";
export const authenticate = async (req, res, next) => {
  let token = req.cookies.token || req.headers.authorization?.split(" ")[1];


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

    if (!user) {
      return res.status(401).json(formatResponse(0, "user not found"));
    }

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json(formatResponse(0,"unauthorized"));
  }
};

export const dpartnerAuthenticate= async(req,res,next)=>{
 let token = req.cookies.token || req.headers.authorization?.split(" ")[1];

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
   

   if (!user) {
     return res.status(401).json(formatResponse(0, "user not found"));
   }

   req.user = user; // Attach user to request
   console.log("r",req.user)
   next();
 } catch (error) {
   console.error("Token verification error:", error);
   return res.status(401).json(formatResponse(0, "unauthorized"));
 }
}
