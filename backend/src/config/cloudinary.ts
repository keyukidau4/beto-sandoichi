import { v2 as cloudinary } from 'cloudinary';
import { config } from './environment';

// Configure Cloudinary with environment-specific settings
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: config.nodeEnv === 'production', // Use HTTPS in production
});

// Validate Cloudinary configuration
export const validateCloudinaryConfig = (): boolean => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  
  if (!cloudName || !apiKey || !apiSecret) {
    if (config.nodeEnv === 'production') {
      throw new Error('Cloudinary configuration is required in production');
    }
    console.warn('Cloudinary configuration is incomplete. Image upload will not work.');
    return false;
  }
  
  return true;
};

// Test Cloudinary connection
export const testCloudinaryConnection = async (): Promise<boolean> => {
  try {
    if (!validateCloudinaryConfig()) {
      return false;
    }
    
    // Test the connection by getting account details
    const result = await cloudinary.api.ping();
    console.log('Cloudinary connection successful:', result);
    return true;
  } catch (error) {
    console.error('Cloudinary connection failed:', error);
    return false;
  }
};

export default cloudinary;