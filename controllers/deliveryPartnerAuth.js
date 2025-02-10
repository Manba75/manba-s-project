import formatResponse from "../helpers/formateResponse.js";
import { checkEmail, dpartnerSignup,updateOTP,verifydpartnerOTP,
  updateResetToken,updatePassword, getAllDpartner ,getDpartnerById,updateDpartnerProfile,
  dpartnerProfileDelete,
  setdPartnerAvailable} from "../models/deliveryPartnerModel.js";
import { generateOTP } from "../helpers/generateOTP.js";
import { sendOTPMail ,sendResetLink} from "../helpers/sendMail.js";
import requestIp from "request-ip";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookies } from "../helpers/generateTokenAndSetCookies.js";
import { dpartnerSignupValidation ,checksEmailValidation ,loginValidation ,resetPasswordVerifyValidation,updateProfileValidation} from "../middleware/validation.js";
import jwt from 'jsonwebtoken'
import { getCityId } from "../models/cityModel.js";
import { getVehicleTypeId } from "../models/vehicletypeModel.js";


//delivery partner email checks
export const dpartnerchecksEmail = async (req, res, next) => {
  try {
 
    await checksEmailValidation.validateAsync(req.body);
    const { email } = req.body;

   
    const emailExist = await checkEmail(email);
    console.log(emailExist);

    return res
      .status(200)
      .json(
        formatResponse(
          1,
          emailExist ? "Email already exists" : "You can proceed with signup."
        )
      );
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

      if (
        !city ||
        !vehicletype ||
        !dpartner_email ||
        !dpartner_pass ||
        !dpartner_phone ||
        !vehicle_number ||
        !vehicle_name
      ) {
        return res
          .status(400)
          .json(
            formatResponse(0, "all feild are required.")
          );
      }
   
    await dpartnerSignupValidation.validateAsync(req.body);

    const createdIp = requestIp.getClientIp(req);
    const city_id = await getCityId(city);
    const vehicletype_id = await getVehicleTypeId(vehicletype);

    if (!city_id) {
      return res.status(400).json(formatResponse(0, "City not found."));
    }

    if (!vehicletype_id) {
      return res.status(400).json(formatResponse(0, "Vehicle type not found."));
    }


    const existingUser = await checkEmail(dpartner_email);
    if (existingUser) {
      return res.status(400).json(formatResponse(0, "Email already exists"));
    }

    // Generate OTP
    const otp = generateOTP();
    const hashpassword = await bcrypt.hash(dpartner_pass, 10);
    console.log("otpp", otp);
    // Save user in DB
    const newUser = await dpartnerSignup(
      city_id,
      vehicletype_id,
      dpartner_email,
      hashpassword,
      createdIp,
      dpartner_licence,
      dpartner_phone,
      vehicle_number,
      vehicle_name,
      otp
    );

    //  Check if dpartnerSignup returned success: false
    if (!newUser || newUser.success === false) {
      return res
        .status(500)
        .json(
          formatResponse(0, "User registration failed", newUser?.error || "")
        );
    }

    const token = generateTokenAndSetCookies(res, newUser.delivery_partner.id);

    // Send OTP email
    await sendOTPMail(dpartner_email, otp);

    return res.status(201).json(
      formatResponse(1, "Delivery partner registered successfully!", {
        user: newUser.delivery_partner,
        vehicle: newUser.vehicle,
        token,
      })
    );
  } catch (error) {
    console.error("Signup Error:", error);
    if(error.isJoi){
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
    let user = await checkEmail(email);
    if (!user) {
      return res.status(400).json(formatResponse(0, "User not found"));
    }

    // const { dpartner_verifyotp, dpartner_expiryotp, dpartner_isverify } = user;

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
      await updateOTP(email, null, null);
      return res
        .status(400)
        .json(formatResponse(0, "OTP expired. Please resend OTP"));
    }

    await verifydpartnerOTP(email);
    await updateOTP(email, null, null);
     user = await checkEmail(email);
    return res
      .status(200)
      .json(formatResponse(1, "User successfully verified",{user}));
  } catch (error) {
    return res
      .status(500)
      .json(formatResponse(0, "Internal server error"));
  }
};

// resend otp
export const dpartnerResenOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await checkEmail(email);
    if (!user) {
      return res.status(400).json(formatResponse(0, "User not found"));
    }

    const { dpartner_isverify } = user;

    if (dpartner_isverify) {
      return res
        .status(401)
        .json(formatResponse(0, "User is already verified"));
    }

    // Generate new OTP
    const newOTP = generateOTP();
    console.log('otp',newOTP)
    const newExpiryTime = new Date();
    newExpiryTime.setMinutes(newExpiryTime.getMinutes() + 10);

    // Update OTP and send email
    await updateOTP(email, newOTP, newExpiryTime);
    await sendOTPMail(email, newOTP);

    return res
      .status(200)
      .json(formatResponse(1, "New OTP sent to your email",{"otp":newOTP}));
  } catch (err) {
    return res.status(500).json(formatResponse(0, "Internal server error"));
  }
};

//login
export const dpartnerLogin =async (req,res,next)=>{
  try {
    await loginValidation.validateAsync(req.body);
    const { email ,password} = req.body;
    const user = await checkEmail(email);
    console.log(user);
    if (!user) {
      return res.status(200).json(formatResponse(1, "email is not exists"));
    } 
    const isMatch=await bcrypt.compare(password,user.dpartner_password)
    if(!isMatch){
       return res.status(200).json(formatResponse(1,"email or password does not match"))
    }

    if(!user.dpartner_isverify){
      return res
        .status(200)
        .json(formatResponse(1, "email is not verified"));
    }
    const token =generateTokenAndSetCookies(res,user.id)

    console.log("t",token)
    return res.status(200).json(formatResponse(1,"Login successfully",{token,user:user
    }))

  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json(formatResponse(0, error.message));
    }
    next(error);
  }

}

// forgot-password
export const dpartnerForgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    await checksEmailValidation.validateAsync(req.body);

    const user = await checkEmail(email);

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

    const resetlink = `http:/localhost:8000/api/dpartner-reset-password?token=${resetToken}&email=${email}`;

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

// reset-password
export const dpartnerResetPassword = async (req, res, next) => {
 
  try {
    await resetPasswordVerifyValidation.validateAsync(req.body);
 const { email, newPassword, resetToken } = req.body;
    // verify token by email
    const user = await checkEmail(email);
    console.log("us", user);
    if (!user) {
      return res
        .status(200)
        .json(formatResponse(0, "user is not found with this email"));
    }

    const { dpartner_resettoken, dpartner_resettoken_expiry, dpartner_password } = user;
    const currentTime = new Date();
    const expirytime = new Date(dpartner_resettoken_expiry);

    if (resetToken !== dpartner_resettoken) {
      return res.status(400).json(formatResponse(0, "Token is invalid"));
    }
    if (currentTime > expirytime) {
      await updateResetToken(email, null, null);
      return res.status(400).json(formatResponse(0, "expire the token"));
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    console.log("hsh", hashPassword);
    await updatePassword(email, hashPassword);

    const updateuser = await checkEmail(email);
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

//get All user


export const getAlldpartnerProfile=async (req,res,next)=>{
   try {

     const user=await getAllDpartner();
     console.log("user",user);

     return res.status(200).json(formatResponse(1,"User success ",{user:user}))
   } catch (error) {
    
       return res.status(400).json(formatResponse(0, error));
  ;
   }
}

//get 1 dpartner

export const getdpartnerProfile = async (req, res) => {
  try {
     const {id}=req.params
    const user = await getDpartnerById(id);
    console.log("user", user);
    if(!user){
       return res.status(200).json(formatResponse("No record found"))
    }
    

    return res
      .status(200)
      .json(formatResponse(1, "User success ", { user: user }));
  } catch (error) {
    return res.status(400).json(formatResponse(0, error));
  }
};

//update profile

export const dpartnerUpdateProfile = async (req, res, next) => {
  try {
    const { id } = req.user;
    
    await updateProfileValidation.validateAsync(req.body);
    const { name, phone } = req.body;
    if(!req.user || !req.user.id){
       return res.status(404).json(0,"User not found",{"authenticate user is":req.user})
    }
   
    // Update user profile in the database
    const updatedUser = await updateDpartnerProfile(id,phone,name);

    if (!updatedUser || updatedUser.success===false) {
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

// delete user 

export const dpartnerDeleteProfile =async(req,res,next)=>{

  try {
    const { id } =req.user;
   
    if(!req.user || !req.user.id){
      return res
    .status(400)
    .json(formatResponse(0, "User not found  ")); 
    }
 //   console.log("id",req.user)
   
   const deleteUser= await dpartnerProfileDelete(id);
   if(!deleteUser){
    return res.status(400).json(formatResponse(0, "deleted failed"));
   }
  
   return res.status(200).json(formatResponse(1,"User successfully deleted",))
    
  } catch (error) {
    return res.status(400).json(formatResponse(0,"Internal Server error ")) 
  }
}

//update the deilverypartner is availabe

export const dpartnerIsAvailable =async(req,res)=>{
   try {
     const { isAvailable}=req.body;
      const {id}=req.params;
      if(!req.user || !req.user.id){
          return res
            .status(400)
            .json(formatResponse(0, "user not find"));
      }
      if(!isAvailable){
          return res
            .status(404)
            .json(formatResponse(0, "required availabilty is fail"));
      }
      const dpartnerId=req.user.id;
      // console.log("dpart",dpartnerId);
     
      const updateAvailabity=await setdPartnerAvailable(dpartnerId,isAvailable);
      // console.log('update',updateAvailabity)
      if(!updateAvailabity || updateAvailabity.success==false){

        return res.status(404).json(formatResponse(0,"Update availabilty is fail"))
      }
      return res.status(200).json(formatResponse(1,"Successfully update availabity of deliveryPartner",updateAvailabity))


    
   } catch (error) {
    return res.status(400).json(formatResponse(0, "Internal Server error ")); 
   }
}

// export { deliveryPartnerSignup ,dpartnerchecksEmail,
//   dpartnerVerifyOTP,dpartnerResenOTP,dpartnerLogin,dpartnerForgotPassword,
//   dpartnerResetPassword,getAlldpartnerProfile,getdpartnerProfile,
//   dpartnerUpdateProfile};
