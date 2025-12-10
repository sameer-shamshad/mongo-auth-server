import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { ACCESS_TOKEN_SECRET } from "../config/env.config.js";

export async function verifyToken(req, res, next) {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
 
  if (!token) {
    return res.status(401).json({ 
      type: "error",
      message: "Unauthorized request.",
    });
  }
 
  try {
    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");
    
    if (!user) {
      return res.status(401).json({ 
        type: "error",
        message: "Invalid access token.",
      });
    }
    
    res.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ 
      type: "error",
      message: `Internal server error! ${error}`
    });
  }
}