/**
 * api-config.ts
 * Centralized configuration for API endpoints.
 * Users can update the API_BASE_URL here for production deployment.
 */

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// For Next.js, relative paths ('') work best with the built-in proxy (rewrites).
// If deploying the backend separately (e.g., on Render), change the production URL here.
const API_BASE_URL = isProduction
  ? '' // Using relative paths for Next.js rewrites. Change to e.g. 'https://api.yourserver.com' if needed.
  : 'http://localhost:3000';

export const API_URLS = {
  base: API_BASE_URL,
  users: {
    base: `${API_BASE_URL}/api/users`,
    login: `${API_BASE_URL}/api/users/login`,
    signup: `${API_BASE_URL}/api/users/signup`,
    profile: `${API_BASE_URL}/api/users/profile`,
  },
  orders: {
    base: `${API_BASE_URL}/api/orders`,
    status: (id: string) => `${API_BASE_URL}/api/orders/${id}/status`,
    claim: (id: string) => `${API_BASE_URL}/api/orders/${id}/claim`,
    return: (id: string) => `${API_BASE_URL}/api/orders/${id}/return`,
    rate: (id: string) => `${API_BASE_URL}/api/orders/${id}/rate`,
    dispute: `${API_BASE_URL}/api/orders/dispute`,
    autoCancel: `${API_BASE_URL}/api/orders/auto-cancel`,
  },
  system: {
    stats: `${API_BASE_URL}/api/system/stats`,
    settings: `${API_BASE_URL}/api/system/settings`,
    contact: `${API_BASE_URL}/api/system/contact`,
  },
  prices: {
    base: `${API_BASE_URL}/api/prices`,
    vendor: (uid: string) => `${API_BASE_URL}/api/prices/${uid}`,
  },
  wallet: {
    history: `${API_BASE_URL}/api/wallet/history`,
    transactions: `${API_BASE_URL}/api/wallet/transactions`,
    deposit: `${API_BASE_URL}/api/wallet/deposit`,
    withdraw: `${API_BASE_URL}/api/wallet/withdraw`,
  }
};

export default API_BASE_URL;
