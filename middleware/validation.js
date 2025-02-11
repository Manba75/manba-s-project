import Joi from 'joi'
const signupValidation = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .required()
    .messages({
      "string.empty": "Email is required.",
      "string.email": "Invalid email format.",
    }),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
});

// check mail validation
const checksEmailValidation = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .required()
    .messages({
      // "email.base": "Invalid the email format",
      "string.empty": "email must be required",
      "string.email": "Invalid email format",
    }),
});

// login validation
const loginValidation = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .required()
    .messages({
      // "email.base": "Invalid the email format",
      "string.empty": "email must be required",
      "string.email": "Invalid email format",
    }),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
});

// reset password validation
const resetPasswordValidation = Joi.object({
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
});
const resetPasswordVerifyValidation = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .messages({
      // "email.base": "Invalid the email format",
      "string.empty": "email must be required",
      "string.email": "Invalid email format",
    }),
  newPassword: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
    resetToken:Joi.string().messages({
      "string.base": "Password must be a string",
      "string.empty": "token is required",
     
    }),
});


// update profile

const updateProfileValidation = Joi.object({
  name: Joi.string().min(2).max(50).messages({
    "string.empty": "name is required",
  }),
  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.length": "Phone number must be exactly 10 digits",
      "string.pattern.base": "Phone number must only contain numbers",
    }),
});

// delivery partner validation

const dpartnerSignupValidation = Joi.object({
  dpartner_email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .required()
    .messages({
      // "email.base": "Invalid the email format",
      "string.empty": "email must be required",
      "string.email": "Invalid email format",
    }),
  dpartner_pass: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
  city: Joi.string().min(3).max(50).required().messages({
    "string.base": "City name should be a string",
    "string.empty": "City name is required",
    "string.min": "City name should be at least 3 characters long",
    "string.max": "City name should not be longer than 50 characters",
  }),
  dpartner_licence: Joi.string()
    .alphanum()
    .min(10)
    .max(15)
    .required()
    .messages({
      "string.base": "License number should be a string",
      "string.empty": "License number is required",
      "string.alphanum": "License number must be alphanumeric",
      "string.min": "License number should be at least 10 characters long",
      "string.max": "License number should not exceed 15 characters",
    }),
  vehicle_name: Joi.string().messages({
    "string.empty": "License number is required",
  }),
  vehicletype: Joi.string().messages({
    "string.empty": "License number is required",
    "string.empty": "vehicle type mustbe required",
  }),
  vehicle_number: Joi.string().messages({
    "string.empty": "License number is required",
  }),
  dpartner_phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.length": "Phone number must be exactly 10 digits",
      "string.pattern.base": "Phone number must only contain numbers",
    }),
});


const orderPlaceValidation = Joi.object({
  id: Joi.string().required().messages({
    "string.empty": "id is required",
  }),
  vehicletype: Joi.string().required().messages({
    "string.empty": "vehicle type is required",
  }),
  pickup: Joi.string().required().messages({
    "string.empty": "pickup  is required",
  }),
  drop: Joi.string().required().messages({
    "string.empty": "drop  is required",
  }),
});






export {
  signupValidation,
  checksEmailValidation,
  loginValidation,
  resetPasswordValidation,
  resetPasswordVerifyValidation,
  updateProfileValidation,
  dpartnerSignupValidation,
  orderPlaceValidation
};