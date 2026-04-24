/**
 * api-config.ts
 * Centralized configuration for API endpoints.
 * Users can update the API_BASE_URL here for production deployment.
 */

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

// Preferred way: use NEXT_PUBLIC_API_URL environment variable.
// Otherwise, relative paths work best for Next.js rewrites in most environments.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (isProduction ? '' : 'http://localhost:3000');

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
