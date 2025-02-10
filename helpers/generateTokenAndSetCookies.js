import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()
const generateTokenAndSetCookies=(res,userId)=>{
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token",token,{
        httpsOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        maxAge:3600000

    })
    return token

}

export {
  generateTokenAndSetCookies
}