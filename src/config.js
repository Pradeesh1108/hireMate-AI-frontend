// Configuration for different environments
const config = {
  // Development environment (local)
  development: {
    backendUrl: 'https://hiremate-ai.onrender.com'
  },
  // Production environment (deployed)
  production: {
    backendUrl: 'https://hiremate-ai.onrender.com' // Replace with your actual production URL
  },
  // For port forwarding and mobile testing
  // IMPORTANT: Replace this IP with your computer's actual IP address
  // To find your IP: 
  // - On Mac/Linux: run 'ifconfig' or 'ip addr'
  // - On Windows: run 'ipconfig'
  // Look for your local network IP (usually starts with 192.168.x.x or 10.0.x.x)
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