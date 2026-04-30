const isProduction = process.env.NODE_ENV === "production";
const isAISPreview = typeof window !== "undefined" && window.location.hostname.includes("ais-");

const API_BASE_URL = (typeof window !== "undefined" && (window.location.hostname.includes("ais-") || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"))
    ? "" // Use relative paths for local dev and AIS proxying
    : (process.env.NEXT_PUBLIC_API_URL || "");

export const API_URLS = {
  base: `${API_BASE_URL}/api`,
  login: `${API_BASE_URL}/api/users/login`,
  signup: `${API_BASE_URL}/api/users/register`,
  orders: `${API_BASE_URL}/api/orders`,
  wallet: `${API_BASE_URL}/api/wallet`,
  prices: `${API_BASE_URL}/api/prices`,
  stats: `${API_BASE_URL}/api/stats`,
};

export default API_BASE_URL;
