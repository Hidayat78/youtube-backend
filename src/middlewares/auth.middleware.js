import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Middleware to verify JWT tokens
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Get the token from cookies or authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // Check if token is present
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // Verify the token using the secret from the environment variables
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // Fixed 'proccess' to 'process'

    // Fetch the user from the database using the ID from the decoded token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken", // Exclude sensitive fields
    );

    // Check if the user exists
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Handle errors and throw a unified error response
    throw new ApiError(401, "Invalid access Token");
  }
});
