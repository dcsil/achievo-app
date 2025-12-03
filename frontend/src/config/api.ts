const ENVIRONMENT = (typeof process !== 'undefined' && process.env?.REACT_APP_API_ENVIRONMENT) || 'production'; // toggle between 'local' or 'production'

const API_CONFIG = {
  environment: ENVIRONMENT,

  baseUrls: {
    local: 'http://127.0.0.1:5000',
    production: 'https://achievo-app.onrender.com'
  }
};

export const getApiBaseUrl = (): string => {
  return API_CONFIG.baseUrls[API_CONFIG.environment as keyof typeof API_CONFIG.baseUrls] || API_CONFIG.baseUrls.local;
};

// Export environment for debugging
export const getCurrentEnvironment = (): string => {
  return API_CONFIG.environment;
};