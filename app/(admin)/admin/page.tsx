'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { 
  Users, ShoppingBag, TrendingUp, AlertTriangle, ShieldCheck, 
  Map, Activity, ArrowUpRight, Check, X as XIcon, 
  Wallet, BarChart3, Megaphone, History, MessageSquare, 
  Search, Filter, MoreHorizontal, UserPlus, Trash2, ExternalLink,
  Edit3, Bike, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Image from 'next/image';

type AdminTab = 'overview' | 'orders' | 'disputes' | 'users' | 'wallets' | 'analytics' | 'marketing' | 'audit';

export default function AdminDashboard() {
  const { approveUser, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = React.useState<AdminTab>('overview');
  const [pendingUsers, setPendingUsers] = React.useState<any[]>([]);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<any[]>([]);

  const [riders, setRiders] = React.useState<any[]>([]);

  React.useEffect(() => {
    const users = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    setAllUsers(users);
    setPendingUsers(users.filter((u: any) => !u.isApproved));
    setRiders(users.filter((u: any) => u.role === 'rider' && u.isApproved));

    const storedAlerts = JSON.parse(localStorage.getItem('qw_alerts') || '[]');
    setAlerts(storedAlerts.sort((a: any, b: any) => b.id - a.id));

    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    setOrders(allOrders);

    const totalRevenue = allOrders.reduce((acc: number, o: any) => acc + (o.totalPrice || 0), 0);
    const activeOrders = allOrders.filter((o: any) => o.status !== 'Delivered' && !o.status.includes('Cancelled')).length;
    
    setStats([
      { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, trend: '+18.2%', icon: TrendingUp, color: 'text-primary' },
      { label: 'Active Orders', value: activeOrders.toString(), trend: '+5.4%', icon: ShoppingBag, color: 'text-tertiary' },
      { label: 'Total Users', value: users.length.toString(), trend: '+12.1%', icon: Users, color: 'text-on-surface' },
      { label: 'System Health', value: '99.9%', trend: 'Stable', icon: Activity, color: 'text-primary' }
    ]);
  }, []);

  const assignRider = (orderId: string, riderPhone: string) => {
    const allOrders = JSON.parse(localStorage.getItem('qw_orders') || '[]');
    const updated = allOrders.map((o: any) => {
      if (o.id === orderId) {
        return { ...o, riderPhone, status: o.status === 'Pending Pickup' ? 'Pending Pickup' : o.status };
      }
      return o;
    });
    localStorage.setItem('qw_orders', JSON.stringify(updated));
    setOrders(updated);
    alert('Rider assigned successfully!');
  };

  const handleApprove = React.useCallback((phone: string) => {
    const updated = approveUser(phone);
    setAllUsers(updated);
    setPendingUsers(updated.filter((u: any) => !u.isApproved));
    
    // Add audit log
    const logs = JSON.parse(localStorage.getItem('qw_audit_logs') || '[]');
    const newLog = {
      id: Date.now(),
      action: 'User Approved',
      target: phone,
      admin: currentUser?.phoneNumber,
      time: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem('qw_audit_logs', JSON.stringify(logs));
    
    alert('User approved successfully!');
  }, [approveUser, currentUser]);

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'marketing', label: 'Marketing', icon: Megaphone },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="pb-32 bg-surface">
        <TopAppBar roleLabel={currentUser?.phoneNumber === '09012345678' ? 'Super Admin' : 'Moderator Admin'} />
        
        <div className="flex pt-20 h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 bg-surface-container-low border-r border-primary/5 p-6 hidden lg:flex flex-col gap-2 overflow-y-auto">
            <div className="mb-8 px-4">
              <p className="font-label text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Control Panel</p>
              <h2 className="text-2xl font-headline font-black text-on-surface tracking-tighter">Quick-Wash</h2>
            </div>
            
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl font-headline font-bold text-sm transition-all active:scale-95",
                  activeTab === tab.id 
                    ? "signature-gradient text-white shadow-lg" 
                    : "text-on-surface-variant hover:bg-surface-container-highest"
                )}
              >
                <tab.icon className={cn("w-5 h-5", activeTab === tab.id && "fill-current")} />
                {tab.label}
              </button>
            ))}

            <div className="mt-auto p-6 bg-primary/5 rounded-3xl border border-primary/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-on-surface">All Systems Operational</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8">
            <header className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-headline font-black text-on-surface tracking-tighter capitalize">
                  {activeTab}
                </h1>
                <p className="text-on-surface-variant font-medium">Manage your campus laundry ecosystem.</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search anything..."
                    className="h-12 pl-10 pr-6 bg-surface-container-low rounded-xl border border-primary/5 outline-none focus:border-primary transition-all text-sm font-medium"
                  />
                </div>
                <button className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-on-surface-variant border border-primary/5">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </header>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div 
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                      <div key={stat.label} className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/5 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-3 rounded-2xl bg-surface-container-lowest shadow-sm", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                          <span className="font-label text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-md">{stat.trend}</span>
                        </div>
                        <p className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-headline font-black text-on-surface">{stat.value}</h3>
                      </div>
                    ))}
                  </div>

                  {/* Pending Approvals */}
                  {pendingUsers.length > 0 && (
                    <section>
                      <h2 className="text-2xl font-headline font-black text-on-surface mb-6">Pending Approvals</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingUsers.map((u) => (
                          <div key={u.phoneNumber} className="bg-surface-container-low p-6 rounded-[2rem] border border-primary/10 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                  <Users className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-headline font-black text-on-surface">{u.fullName}</h4>
                                  <p className="font-label text-[10px] font-black uppercase tracking-widest text-primary">{u.role}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2 mb-6">
                              <p className="text-xs font-medium text-on-surface-variant">Phone: {u.phoneNumber}</p>
                              {u.shopName && <p className="text-xs font-medium text-on-surface-variant">Shop: {u.shopName}</p>}
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleApprove(u.phoneNumber)}
                                className="flex-1 h-12 bg-primary text-on-primary rounded-xl font-headline font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                              >
                                <Check className="w-4 h-4" /> Approve
                              </button>
                              <button className="w-12 h-12 bg-surface-container-highest text-on-surface rounded-xl flex items-center justify-center active:scale-95 transition-transform">
                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                      <h2 className="text-2xl font-headline font-black text-on-surface mb-6">Live Activity Map</h2>
                      <div className="bg-surface-container-lowest aspect-video rounded-[2rem] relative overflow-hidden flex items-center justify-center">
                        <Image src="https://picsum.photos/seed/map/1200/800" alt="Map" fill className="object-cover opacity-20 grayscale" />
                        <div className="relative z-10 text-center">
                          <div className="flex justify-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-primary rounded-full animate-ping"></div>
                            <div className="w-3 h-3 bg-tertiary rounded-full animate-ping delay-75"></div>
                          </div>
                          <p className="font-headline font-bold text-on-surface">12 Active Riders • 45 Deliveries</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                      <h2 className="text-2xl font-headline font-black text-on-surface mb-6">System Alerts</h2>
                      <div className="space-y-4">
                        {alerts.slice(0, 4).map(alert => (
                          <div key={alert.id} className="flex gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-primary/5">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", alert.color)}>
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-on-surface mb-1">{alert.type}</p>
                              <p className="text-[10px] font-medium text-on-surface-variant line-clamp-2">{alert.msg}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div 
                  key="orders"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5">
                    <h2 className="text-2xl font-headline font-black text-on-surface mb-8">Order Management</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-primary/5">
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Order ID</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Customer</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Rider</th>
                            <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                          {orders.map(o => (
                            <tr key={o.id} className="group hover:bg-surface-container-lowest transition-colors">
                              <td className="py-4 font-headline font-bold text-sm">#{o.id}</td>
                              <td className="py-4">
                                <p className="font-headline font-bold text-sm">{o.customerName}</p>
                                <p className="text-[10px] text-on-surface-variant">{o.customerPhone}</p>
                              </td>
                              <td className="py-4">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                  o.color || "bg-primary-container text-primary"
                                )}>
                                  {o.status}
                                </span>
                              </td>
                              <td className="py-4">
                                {o.riderPhone ? (
                                  <div className="flex items-center gap-2">
                                    <Bike className="w-4 h-4 text-primary" />
                                    <span className="text-xs font-bold">{riders.find(r => r.phoneNumber === o.riderPhone)?.fullName || o.riderPhone}</span>
                                  </div>
                                ) : (
                                  <select 
                                    onChange={(e) => assignRider(o.id, e.target.value)}
                                    className="bg-surface-container-highest text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md outline-none border-none"
                                  >
                                    <option value="">Assign Rider</option>
                                    {riders.map(r => (
                                      <option key={r.phoneNumber} value={r.phoneNumber}>{r.fullName}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="py-4">
                                <button className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors">
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div 
                  key="users"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-headline font-black text-on-surface">User Management</h2>
                    <button className="signature-gradient text-white px-6 py-3 rounded-xl font-headline font-bold text-xs flex items-center gap-2 shadow-lg">
                      <UserPlus className="w-4 h-4" /> Add User
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-primary/5">
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">User</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Role</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Trust Points</th>
                          <th className="pb-4 font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {allUsers.map(u => (
                          <tr key={u.phoneNumber} className="group hover:bg-surface-container-lowest transition-colors">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                                  {u.fullName?.[0]}
                                </div>
                                <div>
                                  <p className="font-headline font-bold text-sm">{u.fullName}</p>
                                  <p className="text-[10px] text-on-surface-variant">{u.phoneNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="font-label text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2 py-1 rounded-md">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                u.isApproved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                              )}>
                                {u.isApproved ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 font-headline font-black text-sm">{u.trustPoints || 0}</td>
                            <td className="py-4">
                              <div className="flex gap-2">
                                <button className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-primary transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg bg-surface-container-highest text-on-surface-variant hover:text-error transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div 
                  key="audit"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface-container-low rounded-[2.5rem] p-8 border border-primary/5"
                >
                  <h2 className="text-2xl font-headline font-black text-on-surface mb-8">System Audit Log</h2>
                  <div className="space-y-4">
                    {(JSON.parse(localStorage.getItem('qw_audit_logs') || '[]')).reverse().map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-2xl border border-primary/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <History className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-headline font-bold text-sm">{log.action}</p>
                            <p className="text-[10px] text-on-surface-variant">Admin: {log.admin} • Target: {log.target}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-on-surface-variant">{new Date(log.time).toLocaleString()}</span>
                      </div>
                    ))}
                    {(JSON.parse(localStorage.getItem('qw_audit_logs') || '[]')).length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-primary/10 rounded-3xl">
                        <p className="text-on-surface-variant font-medium">No audit logs found.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Add other tabs as needed... */}
              {['orders', 'disputes', 'wallets', 'analytics', 'marketing'].includes(activeTab) && (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-40 text-center bg-surface-container-low rounded-[3rem] border-2 border-dashed border-primary/10"
                >
                  <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-headline font-black text-on-surface mb-2">Section Under Construction</h3>
                  <p className="text-on-surface-variant font-medium">We are finalizing the {activeTab} module for production.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
