import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
import dotenv from "dotenv"
import { log } from 'console';

dotenv.config()
    // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});
    
const uploadOnClodinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type : "auto"
            }
    )
    
        fs.unlinkSync(localFilePath)
        return response


    } catch (error) {
    console.error("Error uploading to cloudinary:", error.message);
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async (publicId) =>{
    try {
        const result = await cloudinary.uploader.destroy(publicId)
    } catch (error) {
    console.error("Error deleting from cloudinary");
        return null
        
    }

}

export {uploadOnClodinary,deleteFromCloudinary}
    
    
