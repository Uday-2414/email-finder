/**
 * API Configuration
 * Dynamically resolves the backend URL based on environment
 */

const getApiBaseUrl = () => {
  // In production (Render), use the environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:10000';
  }

  // Fallback: use relative path (works if frontend and backend are on same domain)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
