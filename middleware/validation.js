import Joi from 'joi'


export const signupValidation = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .trim()
    .required()
    .replace(/ /g, "")
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
    .trim()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
});

// check mail validation
export const checksEmailValidation = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .trim()
    .replace(/ /g, "")
    .required()
    .messages({
      // "email.base": "Invalid the email format",
      "string.empty": "email must be required",
      "string.email": "Invalid email format",
    }),
});

// login validation
 export const loginValidation = Joi.object({
   email: Joi.string()
     .email({
       minDomainSegments: 2,
       tlds: { allow: ["com", "net"] },
     })
     .lowercase()
     .required()
     .trim()
     .replace(/ /g, "")
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
     .trim()
     .replace(/ /g, "")
     .messages({
       "string.base": "Password must be a string",
       "string.empty": "Password is required",
       "string.pattern.base":
         "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
     }),
 });

// reset password validation
export const resetPasswordValidation = Joi.object({
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .trim()
    .replace(/ /g, "")
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
});
export const resetPasswordVerifyValidation = Joi.object({
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .trim() // Trim any leading or trailing spaces
    .required()
    .replace(/ /g, "")
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email format",
    }),

  newPassword: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .required()
    .trim()
    .replace(/ /g, "") // Trim any leading or trailing spaces
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword")) // Ensures it matches newPassword
    .trim()
    .replace(/ /g, "") // Trim any leading or trailing spaces
    .messages({
      "any.only": "Confirm password must match new password",
      "string.empty": "Confirm password is required",
    }),

  resetToken: Joi.string()
    .required()
    .trim()
    .replace(/ /g, "") // Trim any leading or trailing spaces
    .messages({
      "string.empty": "Token is required",
    }),
});



// update profile

export const updateProfileValidation = Joi.object({
  name: Joi.string().min(2).max(50).trim().replace(/ /g, "").messages({
    "string.empty": "name is required",
  }),
  phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .replace(/ /g, "")
    .trim()
    .messages({
      "string.empty": "Phone number is required",
      "string.length": "Phone number must be exactly 10 digits",
      "string.pattern.base": "Phone number must only contain numbers",
    }),
  // id: Joi.number().positive().min(1).required().messages({
  //   "number.base": "ID must be a valid number",
  //   "number.min": "ID must be a positive number greater than 0",
  //   "number.required": "User ID is required",
  // }),
});


// delete profile



// delivery partner validation

export const dpartnerSignupValidation = Joi.object({
  dpartner_email: Joi.string()
    .trim()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    })
    .lowercase()
    .required()
    .trim()
    .replace(/ /g, "")
    .messages({
      // "email.base": "Invalid the email format",
      "string.empty": "email must be required",
      "string.email": "Invalid email format",
    }),
  dpartner_pass: Joi.string()
    .trim()
    .pattern(
      new RegExp(
        "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,15}$"
      )
    )
    .required()
    .replace(/ /g, "")
    .messages({
      "string.base": "Password must be a string",
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password must be 8-15 characters long, include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
    }),
  city: Joi.string()
    .min(3)
    .max(50)
    .required()
    .trim()
    .replace(/ /g, "")
    .messages({
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
    .trim()
    .replace(/ /g, "")
    .messages({
      "string.base": "License number should be a string",
      "string.empty": "License number is required",
      "string.alphanum": "License number must be alphanumeric",
      "string.min": "License number should be at least 10 characters long",
      "string.max": "License number should not exceed 15 characters",
    }),
  vehicle_name: Joi.string().trim().replace(/ /g, "").messages({
    "string.empty": "License number is required",
  }),
  vehicletype: Joi.string().trim().replace(/ /g, "").messages({
    "string.empty": "vehicle type mustbe required",
  }),
  vehicle_number: Joi.string().trim().replace(/ /g, "").messages({
    "string.empty": "License number is required",
  }),
  dpartner_phone: Joi.string()
    .replace(/ /g, "")
    .trim()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.length": "Phone number must be exactly 10 digits",
      "string.pattern.base": "Phone number must only contain numbers",
    }),
});

export const availabilitySchema = Joi.object({
  isAvailable: Joi.boolean().required().messages({
    "boolean.base": "Availability must be a boolean value.",
    "any.required": "Availability status is required",
  }),
});

export const orderPlaceValidation = Joi.object({
 
  vehicletype: Joi.string().trim().required().replace(/ /g, '').messages({
    "string.empty": "vehicle type is required",
  }),
  pickup: Joi.string().required().trim().replace(/ /g, '').messages({
    "string.empty": "pickup  is required",
  }),
  drop: Joi.string().required().trim().replace(/ /g, '').messages({
    "string.empty": "drop  is required",
  }),
});


export const cityValidation = Joi.object({
  city: Joi.string().required().trim().replace(/ /g, '').messages({
    "string.empty": "city is required",
  }),
  state: Joi.string().trim().required().replace(/ /g, '').messages({
    "string.empty": "state is required",
  }),
});

export const vehicletypeValidation = Joi.object({
  vehicletype: Joi.string().required().trim().replace(/ /g, "").messages({
    "string.empty": "vehicletype is required",
  }),
  max_weight: Joi.string().required().min(1).trim().replace(/ /g, "").messages({
    "string.empty": "max  weight  is required",
    "string.min": "minimum 1 kg is required",
  }),
});





