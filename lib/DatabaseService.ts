/**
 * DatabaseService.ts
 * Acts as a client for the Express backend API.
 */

import { API_URLS } from './api-config';

export type TrustAction = 
  | 'completed_order' 
  | 'five_star_review' 
  | 'admin_good_performance' 
  | 'cancel_after_ready' 
  | 'customer_not_available' 
  | 'late_delivery' 
  | 'rider_abandon' 
  | 'vendor_delay' 
  | 'fake_dispute' 
  | 'repeated_cancellation'
  | 'rider_return_order';

export interface UserData {
  uid: string;
  fullName?: string;
  phoneNumber: string;
  password?: string;
  email: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin';
  isApproved: boolean;
  walletBalance: number;
  pendingBalance: number;
  withdrawalRequested?: boolean;
  trustPoints: number;
  trustScore: number;
  status: 'active' | 'restricted' | 'suspended';
  restrictionExpires?: string;
  lastPenaltyAt?: string;
  lastRecoveryAt?: string;
  shopName?: string;
  vehicleType?: string;
  nin?: string;
  whatsappNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  turnaroundTime?: string;
  capacity?: number;
  address?: string;
  shopAddress?: string;
  landmark?: string;
  isRaining?: boolean;
  shopImage?: string;
  ninImage?: string;
  transferReference?: string;
}

export interface Order {
  id: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  vendorId: string;
  vendorName: string;
  vendorPhone?: string;
  customerAddress?: string;
  customerLandmark?: string;
  vendorLandmark?: string;
  vendorAddress?: string;
  items: string;
  itemsPrice: number;
  riderFee: number;
  totalPrice: number;
  status: string;
  color: string;
  time: string;
  createdAt: string;
  riderUid?: string;
  riderName?: string;
  riderPhone?: string;
  pickupAddress?: string;
  code1?: string | null;
  code2?: string | null;
  code3?: string | null;
  code4?: string | null;
  handoverCode?: string | null;
  washingAt?: string | null;
  readyAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  paidAt?: string | null;
  claimedAt?: string | null;
  paymentMethod?: 'wallet' | 'card' | 'transfer';
  penaltyApplied?: boolean;
  payoutReleased80?: boolean;
  payoutReleased20?: boolean;
  riderPaid?: boolean;
  disputed?: boolean;
  issueDescription?: string | null;
  disputedAt?: string | null;
  evidenceImage?: string | null;
  vendorEvidenceImage?: string | null;
  refundAmount?: number | null;
  rating?: number;
  review?: string;
}

export interface SiteSettings {
  name: string;
  logo: string;
  primaryColor: string;
  contactEmail: string;
  contactPhone: string;
  emergencyAlert: string;
  maintenanceMode: boolean;
  announcement: string;
  landmarks?: { id: string; name: string }[];
  campaigns?: any[];
}

class DatabaseService {
  private getBaseUrl() {
    return API_URLS.base || '';
  }

  async fetchAPI(endpoint: string, options: RequestInit = {}) {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('qw_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    
    const url = `${this.getBaseUrl()}${endpoint}`;
    try {
      const response = await fetch(url, { ...options, headers });
      
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorMessage = 'API request failed';
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return null;
    } catch (err: any) {
      console.error(`API Fetch Error [${url}]:`, err);
      throw err;
    }
  }

  // --- USERS ---
  async getUsers(): Promise<UserData[]> {
    return this.fetchAPI('/api/users');
  }
  
  async getVendors(): Promise<UserData[]> {
    return this.fetchAPI('/api/users/vendors');
  }

  async getUser(uid: string): Promise<UserData | null> {
    return this.fetchAPI(`/api/users/${uid}`);
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<UserData> {
    return this.fetchAPI(`/api/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async updateProfile(data: Partial<UserData>): Promise<UserData> {
    return this.fetchAPI(`/api/users/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteUser(uid: string): Promise<void> {
    await this.fetchAPI(`/api/users/${uid}`, {
      method: 'DELETE'
    });
  }

  // --- AUTH ---
  async signup(data: any) {
    return this.fetchAPI('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async login(phoneOrEmail: string, password?: string) {
    return this.fetchAPI('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ phoneOrEmail, password })
    });
  }

  async approveUser(uid: string, isApproved: boolean = true) {
    return this.fetchAPI(`/api/users/${uid}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved })
    });
  }

  // --- ORDERS ---
  async getOrders(userId?: string, role?: string): Promise<Order[]> {
    let url = '/api/orders';
    if (userId && role) url += `?userId=${userId}&role=${role}`;
    return this.fetchAPI(url);
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.fetchAPI(`/api/orders/${id}`);
  }

  async saveOrder(order: any): Promise<Order> {
    return this.fetchAPI('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
  }

  async deleteOrder(orderId: string): Promise<void> {
    return this.fetchAPI(`/api/orders/${orderId}`, {
      method: 'DELETE'
    });
  }

  async claimOrder(orderId: string, riderUid: string, riderName?: string, riderPhone?: string): Promise<boolean> {
    const result = await this.fetchAPI(`/api/orders/${orderId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ riderUid, riderName, riderPhone })
    });
    return result.success;
  }

  async returnOrder(orderId: string, riderUid: string, reason: string): Promise<boolean> {
    const result = await this.fetchAPI(`/api/orders/${orderId}/return`, {
      method: 'POST',
      body: JSON.stringify({ riderUid, reason })
    });
    return result.success;
  }

  async updateOrderStatus(orderId: string, status: string, color: string, handoverCode?: string): Promise<Order> {
    return this.fetchAPI(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, color, handoverCode })
    });
  }

  async submitDispute(orderId: string, data: any): Promise<Order> {
    return this.fetchAPI(`/api/orders/dispute`, {
      method: 'POST',
      body: JSON.stringify({ orderId, ...data })
    });
  }

  async resolveDispute(orderId: string, resolution: string, customAmount?: number): Promise<Order> {
    return this.fetchAPI(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'resolve_dispute', resolution, customAmount })
    });
  }

  async rateOrder(orderId: string, rating: number, review: string): Promise<Order> {
    return this.fetchAPI(`/api/orders/${orderId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating, review })
    });
  }

  // --- SYSTEM ---
  async getSystemStats() {
    return this.fetchAPI('/api/system/stats');
  }

  async getSiteSettings(): Promise<SiteSettings> {
    return this.fetchAPI('/api/system/settings');
  }

  async updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    return this.fetchAPI('/api/system/settings', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async submitContactForm(data: any) {
    return this.fetchAPI('/api/system/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getAuditLogs() {
    return this.fetchAPI('/api/system/audit');
  }

  async createAuditLog(data: any) {
    return this.fetchAPI('/api/system/audit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- PRICE LISTS ---
  async getVendorPriceList(vendorUid: string): Promise<any[]> {
    return this.fetchAPI(`/api/prices/${vendorUid}`);
  }

  async saveVendorPriceList(vendorUid: string, priceList: any[]): Promise<void> {
    await this.fetchAPI(`/api/prices/${vendorUid}`, {
      method: 'POST',
      body: JSON.stringify({ items: priceList })
    });
  }

  // --- WALLET ---
  async getWalletHistory(uid: string) {
    return this.fetchAPI(`/api/wallet/history?uid=${uid}`);
  }

  async recordTransaction(uid: string, data: any) {
    return this.fetchAPI(`/api/wallet/transactions`, {
      method: 'POST',
      body: JSON.stringify({ uid, ...data })
    });
  }

  async deposit(amount: number, desc?: string) {
    return this.fetchAPI('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, desc })
    });
  }

  async withdraw(amount: number) {
    return this.fetchAPI('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async reportTransaction(transactionId: string, issue: string) {
    return this.fetchAPI(`/api/wallet/transactions/${transactionId}/report`, {
      method: 'POST',
      body: JSON.stringify({ issueDescription: issue })
    });
  }

  // --- RECOVERY & TRUST ---
  async processAutoRecovery(uid: string) {
    return this.fetchAPI(`/api/users/${uid}/recovery`, {
      method: 'POST'
    });
  }

  async adjustTrustPoints(uid: string, action: TrustAction) {
    return this.fetchAPI(`/api/users/${uid}/trust`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  }

  async runAutoCancel() {
    return this.fetchAPI(`/api/orders/auto-cancel`, {
      method: 'POST'
    });
  }
}

export const db = new DatabaseService();
