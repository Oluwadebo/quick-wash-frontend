import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (fileUri: string, folder: string) => {
  if (!fileUri || !fileUri.startsWith('data:image')) return fileUri; // Already a URL or invalid
  
  try {
    const res = await cloudinary.uploader.upload(fileUri, {
      folder: `quick-wash/${folder}`,
      resource_type: 'auto',
    });
    return res.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return fileUri; // Fallback to original
  }
};

export default cloudinary;
