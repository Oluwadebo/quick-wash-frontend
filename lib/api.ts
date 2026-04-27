const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost";

const API_BASE_URL = isProduction
  ? "https://your-production-url.com" // Update this later when you deploy
  : "http://localhost:5000";

export const API_URLS = {
  base: `${API_BASE_URL}/api`,
  login: `${API_BASE_URL}/api/users/login`,
  signup: `${API_BASE_URL}/api/users/register`,
  orders: `${API_BASE_URL}/api/orders`,
  wallet: `${API_BASE_URL}/api/wallet`,
  prices: `${API_BASE_URL}/api/prices`,
};

export default API_BASE_URL;