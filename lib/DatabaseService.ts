/**
 * DatabaseService.ts
 * Abstracts localStorage to simulate a real asynchronous database with atomic transactions.
 */

export interface UserData {
  uid: string;
  fullName: string;
  phoneNumber: string;
  password?: string;
  role: 'customer' | 'vendor' | 'rider' | 'admin';
  isApproved: boolean;
  walletBalance: number;
  pendingBalance: number;
  withdrawalRequested?: boolean;
  trustPoints: number;
  trustScore: number;
  status: 'active' | 'restricted' | 'suspended';
  shopName?: string;
  vehicleType?: string;
  nin?: string;
  whatsappNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  turnaroundTime?: string;
  capacity?: number;
  landmark?: string;
}

export interface Order {
  id: string;
  customerUid: string;
  customerName: string;
  customerPhone: string;
  vendorId: string; // This is the vendor's UID
  vendorName: string;
  vendorPhone?: string;
  customerAddress?: string;
  customerLandmark?: string;
  vendorLandmark?: string;
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
  readyForDeliveryAt?: string | null;
  pickedUpAt?: string | null;
  pickedUpDeliveryAt?: string | null;
  paidAt?: string | null;
  deliveredAt?: string | null;
  completedAt?: string | null;
  penaltyApplied?: boolean;
  payoutReleased?: boolean;
  disputed?: boolean;
  isLocked?: boolean;
  lockedBy?: string;
  lockExpires?: number;
}

const DELAY = 300; // Simulate network latency

class DatabaseService {
  private async delay() {
    return new Promise(resolve => setTimeout(resolve, DELAY));
  }

  // --- USERS ---

  async getUsers(): Promise<UserData[]> {
    await this.delay();
    return JSON.parse(localStorage.getItem('qw_all_users') || '[]');
  }

  async getUser(uid: string): Promise<UserData | null> {
    const users = await this.getUsers();
    return users.find(u => u.uid === uid) || null;
  }

  async updateUser(uid: string, data: Partial<UserData>): Promise<UserData> {
    const users = await this.getUsers();
    const index = users.findIndex(u => u.uid === uid);
    if (index === -1) throw new Error('User not found');
    
    users[index] = { ...users[index], ...data };
    localStorage.setItem('qw_all_users', JSON.stringify(users));
    
    // If updating current user, sync qw_user
    const currentUser = JSON.parse(localStorage.getItem('qw_user') || '{}');
    if (currentUser.uid === uid) {
      localStorage.setItem('qw_user', JSON.stringify(users[index]));
    }
    
    return users[index];
  }

  // --- ORDERS ---

  async getOrders(): Promise<Order[]> {
    await this.delay();
    return JSON.parse(localStorage.getItem('qw_orders') || '[]');
  }

  async getOrder(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find(o => o.id === id) || null;
  }

  async saveOrder(order: Order): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index === -1) {
      orders.push(order);
    } else {
      orders[index] = order;
    }
    localStorage.setItem('qw_orders', JSON.stringify(orders));
    return order;
  }

  /**
   * Atomic Transaction: Claim Order
   * Uses a "First-to-Claim" lock mechanism to prevent double-claiming.
   */
  async claimOrder(orderId: string, riderUid: string, riderName: string, riderPhone: string): Promise<boolean> {
    await this.delay();
    
    // 1. Get current state
    const orders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const orderIndex = orders.findIndex((o: any) => o.id === orderId);
    
    if (orderIndex === -1) return false;
    const order = orders[orderIndex];

    // 2. Check if already claimed or locked
    const now = Date.now();
    if (order.riderUid) return false; // Already claimed
    if (order.isLocked && order.lockExpires && order.lockExpires > now) return false; // Currently being processed by someone else

    // 3. Attempt to set lock (Atomic-ish for localStorage)
    order.isLocked = true;
    order.lockedBy = riderUid;
    order.lockExpires = now + 5000; // 5 second lock
    localStorage.setItem('qw_orders', JSON.stringify(orders));

    // 4. Re-verify after a short jitter to simulate race condition check
    await new Promise(resolve => setTimeout(resolve, 50));
    const recheckOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const recheckOrder = recheckOrders.find((o: any) => o.id === orderId);
    
    if (recheckOrder.lockedBy !== riderUid) return false; // Someone else won the race

    // 5. Finalize claim
    recheckOrder.riderUid = riderUid;
    recheckOrder.riderName = riderName;
    recheckOrder.riderPhone = riderPhone;
    recheckOrder.isLocked = false;
    recheckOrder.lockedBy = undefined;
    recheckOrder.lockExpires = undefined;
    
    localStorage.setItem('qw_orders', JSON.stringify(recheckOrders));
    window.dispatchEvent(new Event('storage'));
    return true;
  }

  async updateOrderStatus(orderId: string, status: string, color: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');
    
    order.status = status;
    order.color = color;
    return await this.saveOrder(order);
  }

  // --- WALLET ---
  async recordTransaction(uid: string, transaction: any) {
    const history = JSON.parse(localStorage.getItem(`qw_wallet_history_${uid}`) || '[]');
    history.unshift({ ...transaction, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() });
    localStorage.setItem(`qw_wallet_history_${uid}`, JSON.stringify(history));
  }
}

export const db = new DatabaseService();
