import {
  findUserByEmail,
  createCustomer,
  findVerifyEmail,
  verifyUserOTP,
  updateOTP,
  updateResetToken,
  updatePassword,
  updateUserProfile,
  getAllUser,
  deleteUserProfile,
  updateLastLogin,
} from "../models/usermodel.js";
import { sendOTPMail, sendResetLink } from "../helpers/sendMail.js";
import { generateOTP } from "../helpers/generateOTP.js";
import requestIp from "request-ip";
import bcrypt from "bcrypt";
import {
  checksEmailValidation,
  signupValidation,
  loginValidation,
  resetPasswordVerifyValidation,
  updateProfileValidation,
 
} from "../middleware/validation.js";
import { generateTokenAndSetCookies } from "../helpers/generateTokenAndSetCookies.js";
import formatResponse from "../helpers/formateResponse.js";
import jwt from "jsonwebtoken";


// customer check email

export const checksEmail = async (req, res, next) => {
  try {
    await checksEmailValidation.validateAsync(req.body);
    const { email } = req.body;
    const emailExist = await findUserByEmail(email);
    if (emailExist) {
      return res.status(200).json(formatResponse(1, "Email already exists"));
    }
    return res
      .status(200)
      .json(formatResponse(1, "You can proceed with signup."));
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};


// customer Signup Controller
export const signup = async (req, res, next) => {
  try {
    await signupValidation.validateAsync(req.body);
    const { email, password } = req.body;
    const createdip = requestIp.getClientIp(req);

    // Generate OTP
    const otp = generateOTP();
    const hashpassword = await bcrypt.hash(password, 10);

    // Save user in DB (this function will handle both new and soft-deleted users)
    const newUser = await createCustomer(email, hashpassword, otp, createdip);

    if (!newUser || newUser.error || newUser.success===false) {
      return res.status(400).json(formatResponse(0, newUser.message));
    }

    // Send OTP email
    await sendOTPMail(email, otp);

    // Generate token
    const token = generateTokenAndSetCookies(res, newUser.id);
    if(!token){
      return res.status(400).json(
      formatResponse(
        0,
        "generating token error" ))
    }
    return res.status(200).json(
      formatResponse(
        1,
        newUser.message + " OTP sent to your email for verification.",
        {
          token,
          user: newUser,
        }
      )
    );
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};


//verify
export const verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;
    let user = await findVerifyEmail(email);
    console.log("user",user)
    if (!user || user.success===false || user.error) {
      return res.status(400).json(formatResponse(0, user.message));
    }
    const {cust_isverify,cust_verifyotp,cust_expiryotp}=user.data
    if (cust_isverify) {
      return res.status(401).json(formatResponse(0, "User already verified"));
    }
     console.log('cust',user.data.cust_verifyotp)
   
    if (otp !== cust_verifyotp) {
      return res.status(400).json(formatResponse(0, "Invalid OTP"));
    }
    const currentTime = new Date();
    const expiryTime = new Date(user.data.cust_expiryotp);
    if (currentTime > expiryTime) {
      const updateOtpStatus = await updateOTP(email, null, null);
      if (!updateOtpStatus || updateOtpStatus.success===false || updateOtpStatus.error) {
        return res.status(500).json(formatResponse(0,updateOtpStatus.message));
      }
      return res
        .status(400)
        .json(formatResponse(0, "OTP expired. Please resend OTP"));
    }
    const verified = await verifyUserOTP(email);
    if (
      !verified ||
      verified.success === false ||
      verified.error 
    ) {
      return res.status(500).json(formatResponse(0, verified.message));
    }
    const updateOtpStatus = await updateOTP(email, null, null);
    if (
      !updateOtpStatus ||
      updateOtpStatus.success === false ||
      updateOtpStatus.error
    ) {
      return res.status(500).json(formatResponse(0, updateOtpStatus.message));
    }
    user = await findVerifyEmail(email);
    return res
      .status(200)
      .json(formatResponse(1, "User verified successfully", { user:user.data }));
  } catch (error) {
    console.log(error)
    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};

// Resend OTP Controller
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findVerifyEmail(email);
    if (!user || user.error || user.success===false) {
      return res.status(400).json(formatResponse(0,user.message));
    }
    if (user.cust_isverify) {
      return res.status(401).json(formatResponse(0, "User already verified"));
    }
    const newOTP = generateOTP();
    
    const newExpiryTime = new Date();
    newExpiryTime.setMinutes(newExpiryTime.getMinutes() + 10);
    const updated = await updateOTP(email, newOTP, newExpiryTime);
    if (!updated || updated.success===false || updated.error) {
      return res.status(500).json(formatResponse(0, updated.message));
    }
    await sendOTPMail(email, newOTP);
    console.log("otp",newOTP)
    // if(!sendOTP){
    //   return res.status(400).json(formatResponse(0, "sending email error"));
    // }
    return res
      .status(200)
      .json(formatResponse(1, "New OTP sent to your email",{otp:newOTP}));
  } catch (error) {
    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};

// login
export const login = async (req, res, next) => 
{
  try {
    
    await loginValidation.validateAsync(req.body);

    const { email, password } = req.body;

    const userResponse = await findUserByEmail(email);
    
    if (!userResponse.success || !userResponse || userResponse.error ) {
      return res.status(200).json(formatResponse(0, userResponse.message));
    }
    
    const user = userResponse.data;

    
    const isMatch = await bcrypt.compare(password, user.cust_password);
    if (!isMatch) {
      return res.status(200).json(formatResponse(1, "Email or password does not match"));
    }
    if (!user.cust_isverify) {
      return res.status(200).json(formatResponse(1, "Email is not verified"));
    }

    
    const updateLastLoginResponse = await updateLastLogin(email);
    if (
      !updateLastLoginResponse.success ||
      !updateLastLoginResponse ||
      updateLastLoginResponse.error
    ) {
      return res
        .status(500)
        .json(formatResponse(0, updateLastLoginResponse.message));
    }

    
    const token = generateTokenAndSetCookies(res, user.id);
    if(!token){
       return res.status(404),json(formatResponse(0,"Error in generating token"))
    }

    return res.status(200).json(formatResponse(1, "Login successful", { token, user }));
    
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};



//forgot password

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    await checksEmailValidation.validateAsync(req.body);

    const user = await findUserByEmail(email);

    if (!user || !user.success || user.error) {
      return res
        .status(400)
        .json(formatResponse(0, user.message));
    }

    // generate resettoken
    const resetToken = jwt.sign({ reset: true }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
 
    const resetToken_expiry = new Date();
    resetToken_expiry.setMinutes(resetToken_expiry.getMinutes() + 10);

    const updateToken= await updateResetToken(email, resetToken, resetToken_expiry);
    if(!updateToken || !updateToken.success || updateToken.error){
       return res.status(400).json(formatResponse(0, updateToken.message));
    }
    const resetlink = `http:/localhost:8000/api/customer/reset-password?token=${resetToken}&email=${email}`;

    const sendLink= await sendResetLink(email, resetlink);
    if(!sendLink){
       return res.status(404).json(formatResponse(0, "Error sending mail"));
    }
    return res.status(200).json(
      formatResponse(1, "ResetLink send in your mail", {
        resetlink: resetlink,
        user: user,
      })
    );
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

//reset password

export const resetPassword = async (req, res, next) => {
  const { email, newPassword, confirmPassword, resetToken } = req.body;

  try {
   
    await resetPasswordVerifyValidation.validateAsync(req.body);

    
    if (newPassword !== confirmPassword) {
      return res.status(400).json(formatResponse(0, "Passwords do not match"));
    }

    
    let user = await findUserByEmail(email);
    if (!user || !user.success || user.error) {
      return res
        .status(400)
        .json(formatResponse(0, user.message));
    }

    const { cust_resettoken, cust_resettoken_expiry } = user;
    const currentTime = new Date();

    
    if (!cust_resettoken || resetToken !== cust_resettoken) {
      return res
        .status(400)
        .json(formatResponse(0, "Invalid or expired token"));
    }

  
    if (currentTime > new Date(cust_resettoken_expiry)) {
      const tokenCleared = await updateResetToken(email, null, null);
      if (!tokenCleared || tokenCleared.success===false || tokenCleared.error) {
        return res
          .status(500)
          .json(formatResponse(0, tokenCleared.message));
      }
      return res.status(400).json(formatResponse(0, "Token has expired"));
    }

   
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSuccess = await updatePassword(email, hashedPassword);

    
    if (!updateSuccess || updateSuccess.success===false || updateSuccess.error) {
      return res
        .status(500)
        .json(formatResponse(0, updateSuccess.message));
    }

    
    const tokenCleared = await updateResetToken(email, null, null);
    if (!tokenCleared || tokenCleared.success === false || tokenCleared.error) {
      return res
        .status(500)
        .json(
          formatResponse(0,tokenCleared.message)
        );
    }

    return res
      .status(200)
      .json(formatResponse(1, "Password reset successfully", { user }));
  } catch (error) {
    
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }

   
    return res
      .status(500)
      .json(formatResponse(0, "Something went wrong. Please try again."));
  }
};

// getALLusers

export const getAllUserProfile = async (req, res, next) => {
  try {
    const user = await getAllUser();
    if (!user || user.success===false || user.error ) {
      return res.status(404).json(formatResponse(0, user.message));
    }

    return res
      .status(200)
      .json(formatResponse(1, user.message, { user: user.data}));
  } catch (error) {
   
    console.error(error); 
    return res
      .status(500)
      .json(
        formatResponse(
          0,
          "An unexpected error occurred. Please try again later."
        )
      );
  }
};


//update profile

export const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.user;

    const { name, phone } = req.body;

    await updateProfileValidation.validateAsync(req.body);

     if (!req.user || !req.user.id) {
       return res.status(400).json(formatResponse(0, "User not found ",{"authenticate user:":req.user}));
     }
    
    const updatedUser = await updateUserProfile(id, name, phone);

    if (!updatedUser || updatedUser.success===false || updatedUser.error) {
      return res.status(500).json(formatResponse(0, updatedUser.message));
    }

    return res
      .status(200)
      .json(
        formatResponse(1, updatedUser.message, { user: updatedUser.data })
      );
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

// delete the user

export const deleteUser = async (req, res, next) => {
  try {
     const { id } = req.user;

    
     if (!req.user || !req.user.id) {
       return res.status(400).json(formatResponse(0, "User not found  "));
     }
    
    
     const deleteUser = await deleteUserProfile(id);
     if (!deleteUser || !deleteUser.success===false || deleteUser.error) {
       return res.status(400).json(formatResponse(0, deleteUser.message));
     }

     return res
       .status(200)
       .json(formatResponse(1, deleteUser.message));
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal Server error"));
  }
};

// logout
export const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "None" }); // Clear the JWT cookie
  return res.status(200).json(formatResponse(1, "Logged out successfully"));
};

