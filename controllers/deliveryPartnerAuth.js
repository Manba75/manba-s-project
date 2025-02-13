import formatResponse from "../helpers/formateResponse.js";
import {
  checkEmail,
  dpartnerSignup,
  updateOTP,
  verifydpartnerOTP,
  updateResetToken,
  updatePassword,
  getAllDpartner,
  getDpartnerById,
  updateDpartnerProfile,
  dpartnerProfileDelete,
  setdPartnerAvailable,
  updateLastLogin
} from "../models/deliveryPartnerModel.js";
import { generateOTP } from "../helpers/generateOTP.js";
import { sendOTPMail, sendResetLink } from "../helpers/sendMail.js";
import requestIp from "request-ip";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookies } from "../helpers/generateTokenAndSetCookies.js";
import {
  dpartnerSignupValidation,
  checksEmailValidation,
  loginValidation,
  resetPasswordVerifyValidation,
  updateProfileValidation,
  availabilitySchema,
} from "../middleware/validation.js";
import jwt from "jsonwebtoken";
import { getCityIdByCityName } from "../models/cityModel.js";
import { getVehicleTypeId } from "../models/vehicletypeModel.js";

//delivery partner email checks
export const dpartnerchecksEmail = async (req, res, next) => {
  try {
    await checksEmailValidation.validateAsync(req.body);
    const { email } = req.body;

    const emailExist = await checkEmail(email);
    if (emailExist) {
      return res.status(200).json(formatResponse(1, "Email already exists"));
    }
    // console.log(emailExist);

    return res
      .status(200)
      .json(formatResponse(1, "You can proceed with signup."));
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }

    console.error("Error checking email:", error);

    return res.status(500).json(formatResponse(0, "Internal Server Error"));
  }
};

//signup
export const deliveryPartnerSignup = async (req, res, next) => {
  const {
    city, // Selected from frontend dropdown
    vehicletype, // Selected from frontend dropdown
    dpartner_email,
    dpartner_pass,
    dpartner_licence,
    dpartner_phone,
    vehicle_number,
    vehicle_name,
  } = req.body;
  try {
    await dpartnerSignupValidation.validateAsync(req.body);

    const createdIp = requestIp.getClientIp(req);
    const city_id = await getCityIdByCityName(city);
    // console.log(city_id.data)
    const vehicletype_id = await getVehicleTypeId(vehicletype);

    if (!city_id || city_id.success === false || city_id.error) {
      return res.status(400).json(formatResponse(0, city_id.message));
    }

    if (
      !vehicletype_id ||
      vehicletype_id.success === false ||
      vehicletype_id.error
    ) {
      return res.status(400).json(formatResponse(0, vehicletype_id.message));
    }

    // Generate OTP
    const otp = generateOTP();
    const hashpassword = await bcrypt.hash(dpartner_pass, 10);

    // Save user in DB
    const newUser = await dpartnerSignup(
      city_id.data,
      vehicletype_id.data,
      dpartner_email,
      hashpassword,
      createdIp,
      dpartner_licence,
      dpartner_phone,
      vehicle_number,
      vehicle_name,
      otp
    );
    // console.log("new", newUser);

    //  Check if dpartnerSignup returned success: false
    if (!newUser || newUser.success === false || newUser.error) {
      return res.status(500).json(formatResponse(0, newUser.message));
    }

    const token = generateTokenAndSetCookies(res, newUser.id);

    // Send OTP email
    await sendOTPMail(dpartner_email, otp);

    return res.status(201).json(
      formatResponse(1, "Delivery partner registered successfully!", {
        dpartner: newUser.data,
        otp: otp,
        token,
      })
    );
  } catch (error) {
    console.error("Signup Error:", error);
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    return res
      .status(500)
      .json(formatResponse(0, "Internal server error", error.message));
  }
};

//verify-otp
export const dpartnerVerifyOTP = async (req, res) => {
  const { otp, email } = req.body;

  try {
    const userResponse = await checkEmail(email);
    console.log(userResponse.data);
    if (!userResponse || userResponse.error || userResponse.success === false) {
      return res.status(400).json(formatResponse(0, "User not found"));
    }
    let user = userResponse.data;

    if (user.dpartner_isverify) {
      return res
        .status(200)
        .json(formatResponse(1, "User is already verified"));
    }

    if (otp !== user.dpartner_verifyotp) {
      return res.status(400).json(formatResponse(0, "Invalid OTP"));
    }

    const currentTime = new Date();
    const expiryTime = new Date(user.dpartner_expiryotp);

    if (currentTime > expiryTime) {
      const otpReset = await updateOTP(email, null, null);
      if (!otpReset || otpReset.error || otpReset.success === false) {
        return res.status(500).json(formatResponse(0, otpReset.message));
      }
      return res
        .status(400)
        .json(formatResponse(0, "OTP expired. Please resend OTP"));
    }

    const verifyResult = await verifydpartnerOTP(email);
    if (!verifyResult || verifyResult.error || verifyResult.success === false) {
      return res.status(500).json(formatResponse(0, verifyResult.message));
    }

    const otpReset = await updateOTP(email, null, null);
    if (!otpReset || otpReset.error || otpReset.success === false) {
      return res.status(500).json(formatResponse(0, otpReset.message));
    }

    user = await checkEmail(email);
    if (!user) {
      return res.status(400).json(formatResponse(0, user.message));
    }

    return res
      .status(200)
      .json(formatResponse(1, "User successfully verified", user.data));
  } catch (error) {
    console.error("Error in dpartnerVerifyOTP:", error);
    return res
      .status(500)
      .json(formatResponse(0, "Internal server error", null, error.message));
  }
};

// resend otp
export const dpartnerResenOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const userResponse = await checkEmail(email);
    if (!userResponse || userResponse.error || userResponse.success === false) {
      return res.status(400).json(formatResponse(0, "User not found"));
    }
    const user = userResponse.data;
    if (user.dpartner_isverify) {
      return res
        .status(401)
        .json(formatResponse(0, "User is already verified"));
    }

    const newOTP = generateOTP();
    // console.log("Generated OTP:", newOTP);
    const newExpiryTime = new Date();
    newExpiryTime.setMinutes(newExpiryTime.getMinutes() + 10);

    const otpUpdate = await updateOTP(email, newOTP, newExpiryTime);
    if (!otpUpdate || otpUpdate.error || otpUpdate.success === false) {
      return res.status(500).json(formatResponse(0, otpUpdate.message));
    }
    await sendOTPMail(email, newOTP);

    return res
      .status(200)
      .json(formatResponse(1, "New OTP sent to your email", { otp: newOTP }));
  } catch (error) {
    console.error("Error in dpartnerResenOTP:", error);
    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};

//login
export const dpartnerLogin = async (req, res, next) => {
  try {
    await loginValidation.validateAsync(req.body);
    const { email, password } = req.body;
    const userResponse = await checkEmail(email);
    if (!userResponse || userResponse.success === false || userResponse.error) {
      return res.status(200).json(formatResponse(1, userResponse.message));
    }
     let user = userResponse.data;
    // console.log("oa", userResponse);
    const isMatch = await bcrypt.compare(password, user.dpartner_password);
    if (!isMatch) {
      return res
        .status(200)
        .json(formatResponse(1, "email or password does not match"));
    }

    if (!user.dpartner_isverify) {
      return res.status(200).json(formatResponse(1, "email is not verified"));  

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
    if (!token) {
      return (
        res.status(404), json(formatResponse(0, "Error in generating token"))
      );
    }
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

// forgot-password
export const dpartnerForgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    await checksEmailValidation.validateAsync(req.body);

    const userResponse = await checkEmail(email);
    if (!userResponse || userResponse.success === false || userResponse.error) {
      return res.status(200).json(formatResponse(1, userResponse.message));
    }

    const resetToken = jwt.sign({ reset: true }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const resetToken_expiry = new Date();
    resetToken_expiry.setMinutes(resetToken_expiry.getMinutes() + 10);

    const tokenUpdate = await updateResetToken(
      email,
      resetToken,
      resetToken_expiry
    );
    if (!tokenUpdate || tokenUpdate.error || tokenUpdate.success === false) {
      return res.status(500).json(formatResponse(0, tokenUpdate.message));
    }

    const resetlink = `http://localhost:8000/api/dpartner/reset-password?token=${resetToken}&email=${email}`;
    await sendResetLink(email, resetlink);

    return res.status(200).json(
      formatResponse(1, "Reset link sent to your email", {
        resetlink: resetlink,
        user: userResponse.data,
      })
    );
  } catch (error) {
    console.error("Error in dpartnerForgotPassword:", error);

    if (error.isJoi) {
      return res
        .status(400)
        .json(formatResponse(0, "Validation Error: " + error.message));
    }

    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};

// reset-password
export const dpartnerResetPassword = async (req, res, next) => {
  try {
    await resetPasswordVerifyValidation.validateAsync(req.body);
    const { email, newPassword,confirmPassword, resetToken } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json(formatResponse(0, "Passwords do not match"));
    }
    // verify token by email
    const userResponse = await checkEmail(email);
    if (!userResponse || userResponse.success === false || userResponse.error) {
      return res.status(200).json(formatResponse(1, userResponse.message));
    }
    let user = userResponse.data;
    const {
      dpartner_resettoken,
      dpartner_resettoken_expiry,
    } = user;
    const currentTime = new Date();
    const expirytime = new Date(dpartner_resettoken_expiry);

    if (resetToken !== dpartner_resettoken) {
      return res.status(400).json(formatResponse(0, "Token is invalid"));
    }
    if (currentTime > expirytime) {
      const updateresetToken = await updateResetToken(email, null, null);
      if (
        !updateresetToken ||
        updateresetToken.success === false ||
        updateresetToken.error
      ) {
        return res
          .status(500)
          .json(formatResponse(0, updateresetToken.message));
      }
      return res.status(400).json(formatResponse(0, "expire the token"));
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);

    const updateSuccess = await updatePassword(email, hashPassword);

    if (
      !updateSuccess ||
      updateSuccess.success === false ||
      updateSuccess.error
    ) {
      return res.status(500).json(formatResponse(0, updateSuccess.message));
    }
    const updateuser = await checkEmail(email);
    if (!updateuser || updateuser.success === false || updateuser.error) {
      return res.status(500).json(formatResponse(0, updateuser.message));
    }

    const tokenCleared = await updateResetToken(email, null, null);
    if (!tokenCleared || tokenCleared.success === false || tokenCleared.error) {
      return res.status(500).json(formatResponse(0, tokenCleared.message));
    }

    return res.status(200).json(
      formatResponse(1, "Password is reset successfully", {
        user: updateuser.data,
      })
    );
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

//get All user

export const getAlldpartnerProfile = async (req, res, next) => {
  try {
    const user = await getAllDpartner();
    if (!user || user.success === false || user.error) {
      return res.status(404).json(formatResponse(0, user.message));
    }

    return res
      .status(200)
      .json(formatResponse(1, "User success ", { user: user.data }));
  } catch (error) {
    return res.status(400).json(formatResponse(0, error));
  }
};

//get 1 dpartner

export const getdpartnerProfile = async (req, res) => {
  try {
    if (!req.user.data || !req.user.data.id) {
      return res.status(401).json(formatResponse(0, "Unauthorized access"));
    }

    const { id } = req.user.data;

    let user;

    user = await getDpartnerById(id);
    if (!user || user.success === false || user.error) {
      return res.status(500).json(formatResponse(0, user.message));
    }

    return res
      .status(200)
      .json(formatResponse(1, "User fetched successfully", user.data));
  } catch (error) {
    return res
      .status(500)
      .json(formatResponse(0, "Internal server error", error.message));
  }
};

//update profile

export const dpartnerUpdateProfile = async (req, res, next) => {
  try {
   

    await updateProfileValidation.validateAsync(req.body);
    const { name, phone } = req.body;
    if (!req.user.data || !req.user.data.id) {
      return res.status(400).json(formatResponse(0, "User not found"));
    }
     const { id } = req.user.data;
     
   
    // Update user profile in the database
    const updatedUser = await updateDpartnerProfile(id, phone, name);


    if (!updatedUser || updatedUser.success === false || updatedUser.error) {
      return res.status(500).json(formatResponse(0, updatedUser.message));
    }

    return res
      .status(200)
      .json(
        formatResponse(1,updatedUser.message, updatedUser.data)
      );
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }
};

// delete user

export const dpartnerDeleteProfile = async (req, res, next) => {
  try {
    const { id } = req.user.data;

    if (!req.user.data || req.user.error || req.user.success===false) {
      return res.status(400).json(formatResponse(0, req.user.message));
    }
    //   console.log("id",req.user)

    const deleteUser = await dpartnerProfileDelete(id);
    if (!deleteUser || deleteUser.success === false || deleteUser.error) {
      return res.status(400).json(formatResponse(0, deleteUser.message));
    }

    return res.status(200).json(formatResponse(1, deleteUser.message));
  } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal Server error "));
  }
};

//update the deilverypartner is availabe

export const dpartnerIsAvailable = async (req, res) => {
  try {
      const { id } = req.user.data;
      // console.log(req.user.data);
    const { isAvailable } = req.body;
  

    await availabilitySchema.validateAsync(req.body);

    if (!req.user.data || !req.user.data.id) {
      return res
        .status(400)
        .json(formatResponse(0, req.user.message));
    }

    const dpartnerId = req.user.data.id;

    const updateAvailability = await setdPartnerAvailable(
      dpartnerId,
      isAvailable
    );

    // Check if the update failed
    if (!updateAvailability || updateAvailability.success === false) {
      return res
        .status(400)
        .json(formatResponse(0, updateAvailability.message));
    }

    return res
      .status(200)
      .json(
        formatResponse(
          1,
          "Successfully updated the availability of the delivery partner",
          updateAvailability.data
        )
      );
  } catch (error) {
    return res
      .status(500)
      .json(formatResponse(0, "Internal server error", error.message));
  }
};
