import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from "../utils/ApiError.js";

dotenv.config();
// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload files to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath || !fs.existsSync(localFilePath)) {
    throw new ApiError(400, "Local file path is missing or invalid");
  }

  try {
    console.log("Attempting to upload file to Cloudinary:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // console.log("File uploaded successfully:", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Remove the file if upload failed
    }
    throw new ApiError(500, "Failed to upload file to Cloudinary");
  }
};

export { uploadOnCloudinary };
