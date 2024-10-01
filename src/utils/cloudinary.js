import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //pload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uloaded sucessfully
    console.log("File is uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    console.log("File upload Error", error);
    fs.unlinkSync(localFilePath); // remove the locally saved temproary file
    return null;
  }
};

export { uploadOnCloudinary };
