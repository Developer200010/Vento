import jwt from "jsonwebtoken";
import User from "../models/user";
import connectDB from "../config/database";

/**
 * Get current user from request
 * Works for both password and Google login
 */
export async function getCurrentUser(request) {
  try {
    await connectDB();

    // Get token from cookie
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return null;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database
    const user = await User.findById(decoded.userId).select("-password");
    
    return user;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

/**
 * Get just the userId from request (faster, no DB query)
 */
export function getUserId(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Create JWT token (for both login methods)
 */
export function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}