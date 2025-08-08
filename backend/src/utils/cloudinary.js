import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"
import { log } from 'console';

dotenv.config()
    // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
    
const uploadOnClodinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type : "auto"
            }
        )
        console.log("File Uploaded on Cloudnary.");
        // Once file uploaded to cloud delte from server
        fs.unlinkSync(localFilePath)
        return response


    } catch (error) {
        console.log("Error uploading to cloudinary:", error.message);
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async (publicId) =>{
    try {
        const result = await cloudinary.uploader.destroy(publicId)
    } catch (error) {
        console.log("Error deleting from cloudinary");
        return null
        
    }

}

export {uploadOnClodinary,deleteFromCloudinary}
    
    
    // // Optimize delivery by resizing and applying auto-format and auto-quality
    // const optimizeUrl = cloudinary.url('shoes', {
    //     fetch_format: 'auto',
    //     quality: 'auto'
    // });
    
    // console.log(optimizeUrl);
    
    // // Transform the image: auto-crop to square aspect_ratio
    // const autoCropUrl = cloudinary.url('shoes', {
    //     crop: 'auto',
    //     gravity: 'auto',
    //     width: 500,
    //     height: 500,
    // });
    
    // console.log(autoCropUrl);    
