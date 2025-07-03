// Configuration for different environments
const config = {
  // Development environment (local)
  development: {
    backendUrl: 'http://0.0.0.0:8000'
  },
  // Production environment (deployed)
  production: {
    backendUrl: 'https://hiremate-ai.onrender.com' // Replace with your actual production URL
  },
 
  mobile: {
    backendUrl: 'https://hiremate-ai.onrender.com' // Replace with your computer's IP address
  }
};

// Detect environment
const getEnvironment = () => {
  const hostname = window.location.hostname;
  
  // Manual override for testing (uncomment and set to 'mobile' for mobile testing)
  // return 'mobile';
  
  // If accessing from localhost, use development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  // If accessing from mobile device or different IP, use mobile config
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'mobile';
  }
  
  // Default to development
  return 'development';
};

// Get current configuration
const currentConfig = config[getEnvironment()];

// Export the backend URL
export const BACKEND_URL = currentConfig.backendUrl;

// Removed all console.log statements at the bottom of the file 