import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token",
    );
  }
};
// Function to handle file uploads
const handleFileUploads = async (req) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // let coverImageLocalPath;
  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.field.coverImage;
  // }

  console.log("Avatar file path:", avatarLocalPath); // Log avatar path
  console.log("Cover image file path:", coverImageLocalPath); // Log cover image path

  // Ensure avatar is provided
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  // Upload avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar to Cloudinary");
  }

  // Upload cover image to Cloudinary (optional)
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath)
    : null;

  return { avatar, coverImage };
};

// Register user handler
const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend
  const { fullName, email, username, password } = req.body;
  console.log("email", email);

  // Validate fields
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists by username or email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with that email or username already exists");
  }
  console.log(req.files);
  // Handle avatar and cover image upload
  const { avatar, coverImage } = await handleFileUploads(req);

  // Create the user in the database
  const user = await User.create({
    fullName,
    avatar: avatar.url, // Use the URL from Cloudinary
    coverImage: coverImage?.url || "", // Default to empty string if no cover image
    email,
    password,
    username: username.toLowerCase(),
  });

  // Fetch the created user without password or refresh token
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Return the response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body-> data
  const { email, username, password } = req.body;

  // Ensure either email or username is provided
  if (!(username || email)) {
    throw new ApiError(400, "Username or email is required");
  }

  // Find the user by username or email
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  // If the user is not found
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Check if the provided password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  // If the password is incorrect
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // If the password is correct, generate access and refresh tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  // Get the logged-in user info, excluding sensitive fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  // Options for secure cookies
  const options = {
    httpOnly: true,
    secure: true, // Secure is typically true in production when using HTTPS
  };

  // Return response with access and refresh tokens in cookies, and user info in JSON
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, resp) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export { registerUser, loginUser, logoutUser };
