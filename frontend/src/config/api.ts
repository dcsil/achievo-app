const API_CONFIG = {
  // Toggle between 'local' and 'production'
  environment: process.env.REACT_APP_API_ENV || 'local',
  
  baseUrls: {
    local: 'http://127.0.0.1:5000',
    production: 'https://achievo-app.onrender.com'
  }
};

export const getApiBaseUrl = (): string => {
  return API_CONFIG.baseUrls[API_CONFIG.environment as keyof typeof API_CONFIG.baseUrls] || API_CONFIG.baseUrls.local;
};
