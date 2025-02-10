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

const checksEmail = async (req, res, next) => {
  try {
    await checksEmailValidation.validateAsync(req.body);
    const { email } = req.body;
    const emailExist = await findUserByEmail(email);
    console.log(emailExist);
    if (emailExist) {
      return res.status(200).json(formatResponse(1, "email is already exists"));
    } else {
      return res
        .status(200)
        .json(formatResponse(1, "you can proceed with signup."));
    }
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

// customer Signup Controller
const signup = async (req, res, next) => {
  try {
    await signupValidation.validateAsync(req.body);
    const { email, password } = req.body;
    const createdip = requestIp.getClientIp(req);

    // Check if the user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json(formatResponse(0, "Email already exists"));
    }

    // Generate OTP
    const otp = generateOTP();
    const hashpassword = await bcrypt.hash(password, 10);

    // Save user in DB
    const newUser = await createCustomer(email, hashpassword, otp, createdip);
    if (!newUser) {
      return res
        .status(500)
        .json(formatResponse(0, "User registration failed"));
    }

    // Send OTP email
    await sendOTPMail(email, otp);

    // Generate token
    const token = generateTokenAndSetCookies(res, newUser.id);
    return res.status(200).json(
      formatResponse(
        1,
        "User registered! OTP sent to your email for verification.",
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

// Verify OTP Controller
const verifyOTP = async (req, res) => {
  const { otp, email } = req.body;

  try {
    let user = await findVerifyEmail(email);
    if (!user) {
      return res.status(400).json(formatResponse(0, "User not found"));
    }

    if (user.cust_isverify) {
      return res
        .status(401)
        .json(formatResponse(0, "User is already verified"));
    }

    if (otp !== user.cust_verifyotp) {
      return res.status(400).json(formatResponse(0, "Invalid OTP"));
    }

    const currentTime = new Date();
    const expiryTime = new Date(user.cust_expiryotp);

    if (currentTime > expiryTime) {
      await updateOTP(email, null, null);
      return res
        .status(400)
        .json(formatResponse(0, "OTP expired. Please resend OTP"));
    }

    // Verify user and clear OTP
    await verifyUserOTP(email);
    await updateOTP(email, null, null);

    // Fetch updated user to confirm changes
    user = await findVerifyEmail(email);

    return res
      .status(200)
      .json(formatResponse(1, "User successfully verified", { user }));
  } catch (error) {
    console.error("Internal Error:", error);
    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};

// Resend OTP Controller
const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findVerifyEmail(email);
    if (!user) {
      return res.status(400).json(formatResponse(0, "User not found"));
    }

    // const { cust_isverify } = user;

    if (user.cust_isverify) {
      return res
        .status(401)
        .json(formatResponse(0, "User is already verified"));
    }

    // Generate new OTP
    const newOTP = generateOTP();
    const newExpiryTime = new Date();
    newExpiryTime.setMinutes(newExpiryTime.getMinutes() + 10);

    // Update OTP and send email
    await updateOTP(email, newOTP, newExpiryTime);
    await sendOTPMail(email, newOTP);

    return res
      .status(200)
      .json(formatResponse(1, "New OTP sent to your email",{"OTP":newOTP}));
  } catch (err) {
    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};

// login
const login = async (req, res, next) => {
  try {
    await loginValidation.validateAsync(req.body);
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    console.log(user);
    if (!user) {
      return res.status(200).json(formatResponse(1, "email is not exists"));
    }
    const isMatch = await bcrypt.compare(password, user.cust_password);
    if (!isMatch) {
      return res
        .status(200)
        .json(formatResponse(1, "email or password does not match"));
    }

    if (!user.cust_isverify) {
      return res.status(200).json(formatResponse(1, "email is not verified"));
    }
    const token = generateTokenAndSetCookies(res, user.id);

    console.log("t", token);
    return res
      .status(200)
      .json(formatResponse(1, "Login successfully", { token, user: user }));
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

//forgot password

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    await checksEmailValidation.validateAsync(req.body);

    const user = await findUserByEmail(email);

    if (!user) {
      return res
        .status(400)
        .json(formatResponse(0, "user not found with this email"));
    }

    // generate resettoken
    const resetToken = jwt.sign({ reset: true }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("reset", resetToken);
    const resetToken_expiry = new Date();
    resetToken_expiry.setMinutes(resetToken_expiry.getMinutes() + 10);

    await updateResetToken(email, resetToken, resetToken_expiry);

    const resetlink = `http:/localhost:8000/api/reset-password?token=${resetToken}&email=${email}`;

    await sendResetLink(email, resetlink);
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

const resetPassword = async (req, res, next) => {
  const { email, newPassword, resetToken } = req.body;
  try {
    await resetPasswordVerifyValidation.validateAsync(req.body);

    // verify token by email
    const user = await findUserByEmail(email);
    console.log("us", user);
    if (!user) {
      return res
        .status(200)
        .json(formatResponse(0, "user is not found with this email"));
    }

    const { cust_resettoken, cust_resettoken_expiry, cust_password } = user;
    const currentTime = new Date();
    const expirytime = new Date(cust_resettoken_expiry);

    if (resetToken !== cust_resettoken) {
      return res.status(400).json(formatResponse(0, "Token is invalid"));
    }
    if (currentTime > expirytime) {
      await updateResetToken(email, null, null);
      return res.status(400).json(formatResponse(0, "expire the token"));
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    console.log("hsh", hashPassword);
    await updatePassword(email, hashPassword);

    const updateuser = await findUserByEmail(email);
    if (!updateuser) {
      return res.status(500).json(formatResponse(0, "Profile update failed"));
    }
    await updateResetToken(email, null, null);

    return res.status(200).json(
      formatResponse(1, "Password is reset successfully", {
        user: updateuser,
      })
    );
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

// getALLusers

const getAllUserProfile = async (req, res, next) => {
  try {
    //  const {email } =req.body

    const user = await getAllUser();
    console.log("user", user);

    return res
      .status(200)
      .json(formatResponse(1, "User success ", { user: user }));
  } catch (error) {
    //  if (error.isJoi) {
    return res.status(400).json(formatResponse(0, error));
    //  }
    //  next(error);
  }
};

//update profile

const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    console.log("id", id);
    const { name, phone } = req.body;

    await updateProfileValidation.validateAsync(req.body);

     if (!req.user || !req.user.id) {
       return res.status(400).json(formatResponse(0, "User not found ",{"authenticate user:":req.user}));
     }
    
    const updatedUser = await updateUserProfile(id, name, phone);

    if (!updatedUser) {
      return res.status(500).json(formatResponse(0, "Profile update failed"));
    }

    return res
      .status(200)
      .json(
        formatResponse(1, "Profile updated successfully", { user: updatedUser })
      );
  } catch (error) {
    // console.error("Update Profile Error:", error);
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

// delete the user

const deleteUser = async (req, res, next) => {
  try {
     const { id } = req.user;

     if (!req.user || !req.user.id) {
       return res.status(400).json(formatResponse(0, "User not found  "));
     }
     console.log("id", req.user);
    
     const deleteUser = await deleteUserProfile(id);
     if (!deleteUser) {
       return res.status(400).json(formatResponse(0, "deleted failed"));
     }

     return res
       .status(200)
       .json(formatResponse(1, "User successfully deleted"));
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal Server error"));
  }
};

// logout
const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "None" }); // Clear the JWT cookie
  return res.status(200).json(formatResponse(1, "Logged out successfully"));
};

// Export controllers
export {
  signup,
  verifyOTP,
  resendOTP,
  checksEmail,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
  getAllUserProfile,
  logout,
  deleteUser,
};
