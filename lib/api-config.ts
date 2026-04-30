const isProduction = process.env.NODE_ENV === "production";
const isAISPreview = typeof window !== "undefined" && window.location.hostname.includes("ais-");

// Use a relative path during development in AIS to trigger Next.js rewrites/proxies
// or use the production URL if deployed.
const API_BASE_URL = isAISPreview 
    ? "" // Relative path handles proxying in AIS
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

export const API_URLS = {
  base: `${API_BASE_URL}/api`,
  login: `${API_BASE_URL}/api/users/login`,
  signup: `${API_BASE_URL}/api/users/register`,
  orders: `${API_BASE_URL}/api/orders`,
  wallet: `${API_BASE_URL}/api/wallet`,
  prices: `${API_BASE_URL}/api/prices`,
};

export default API_BASE_URL;
