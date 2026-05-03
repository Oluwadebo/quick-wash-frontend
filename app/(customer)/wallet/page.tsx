'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, CreditCard, Landmark, ShieldCheck, ChevronRight, Bolt, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/ApiService';
import { API_URLS } from '@/lib/api-config';

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [balance, setBalance] = React.useState(0);
  const [history, setHistory] = React.useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = React.useState<any>(null);
  const [timeRange, setTimeRange] = React.useState<'7d' | '14d' | '30d' | '2m' | 'today' | 'custom'>('30d');
  const [customRange, setCustomRange] = React.useState({ start: '', end: '' });
  const [isFunding, setIsFunding] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'transfer' | 'card' | null>(null);
  const [fundAmount, setFundAmount] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showSuccessView, setShowSuccessView] = React.useState(false);
  const fetchWalletData = React.useCallback(async () => {
    if (!user?.uid) return;
    try {
      console.log(`[Wallet] Fetching data for ${user.uid}...`);
      // Use timestamp to bypass any browser cache
      const response = await fetch(`${API_URLS.wallet}/history?userId=${user.uid}&t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('qw_token')}`,
          'Accept': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Force state update by using a function to ensure we're not using stale data
        setHistory(data.transactions || []);
        setBalance(data.balance || 0);
        console.log(`[Wallet] History synced. Count: ${data.transactions?.length}`);
      } else {
        console.error('[Wallet] Server error:', response.status);
      }
    } catch (error) {
      console.error('[Wallet] Failed to fetch wallet info:', error);
    }
  }, [user]);

  React.useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const [lastFundedAmount, setLastFundedAmount] = React.useState(0);

  const handleFundWallet = React.useCallback(async () => {
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    const amount = Number(fundAmount);

    try {
      const response = await fetch(`${API_URLS.wallet}/fund`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qw_token')}`
        },
        body: JSON.stringify({ amount, method: paymentMethod, userId: user?.uid }),
      });

      const contentType = response.headers.get("content-type");
      let result;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'Server returned an error');
      }

      if (response.ok) {
        // 1. Success state first
        console.log('[Wallet] Funding success, updating UI states...');
        setBalance(result.balance);
        setLastFundedAmount(amount);
        
        // Sync global auth state
        if (refreshUser) await refreshUser();
        
        // 2. Immediate History Update with optimistic transaction
        if (result.transaction) {
          console.log('[Wallet] Adding new transaction to history:', result.transaction._id);
          setHistory(prev => {
            const tx = result.transaction;
            const exists = prev.some(t => 
              (t._id && tx._id && t._id === tx._id) || 
              (t.id && tx.id && t.id === tx.id)
            );
            return exists ? prev : [tx, ...prev];
          });
        }
        
        // 3. UI Flow: Close form and SHOW SUCCESS MODAL
        setIsFunding(false);
        setIsProcessing(false);
        
        // Use a more robust trigger for the success modal
        // We set it after a clean tick to avoid transition conflicts
        requestAnimationFrame(() => {
          setTimeout(() => {
            setShowSuccessView(true);
            console.log('[Wallet] Success modal triggered successfully');
          }, 400); 
        });
        
        // 4. Cleanup inputs
        setPaymentMethod(null);
        setFundAmount('');

        // 5. Background verify fetch with longer delay to ensure DB consistency
        setTimeout(() => {
          fetchWalletData();
          console.log('[Wallet] Background history refresh executed');
        }, 2500);
      } else {
        console.error('[Wallet] Funding failed:', result);
        alert(result.message || result.error || 'Funding failed');
      }
    } catch (error: any) {
      console.error('Funding error:', error);
      alert(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [fundAmount, paymentMethod, user?.uid, fetchWalletData]);

  const filteredHistory = React.useMemo(() => {
    const now = new Date();
    return history.filter(item => {
      const itemDate = new Date(item.date || item.createdAt);
      
      if (timeRange === 'custom') {
        if (!customRange.start || !customRange.end) return true;
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      }

      const diffInDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (timeRange === 'today') return itemDate.toDateString() === now.toDateString();
      if (timeRange === '7d') return diffInDays <= 7;
      if (timeRange === '14d') return diffInDays <= 14;
      if (timeRange === '30d') return diffInDays <= 30;
      if (timeRange === '2m') return diffInDays <= 60;
      
      return true;
    });
  }, [history, timeRange, customRange]);

  const timeRangeLabel = {
    'today': 'Today',
    '7d': 'Last 7 Days',
    '14d': 'Last 14 Days',
    '30d': 'Last 30 Days',
    '2m': 'Last 2 Months',
    'custom': 'Custom Range'
  }[timeRange];

  return (
    <div className="pb-32">
      <TopAppBar title="My Wallet" />

      <main className="pt-8 px-4 sm:px-6 max-w-2xl mx-auto space-y-6 sm:space-y-8">
        {/* Balance Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary p-7 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] text-on-primary shadow-2xl shadow-primary/20 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 opacity-80 mb-4">
              <Wallet className="w-5 h-5" />
              <span className="font-label text-xs font-black uppercase tracking-[0.3em]">Available Balance</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-headline font-black tracking-tighter mb-10 overflow-hidden text-ellipsis">
              ₦{balance.toLocaleString()}
            </h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsFunding(true)}
                className="flex-1 bg-white text-primary h-16 rounded-2xl font-headline font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
              >
                <Plus className="w-5 h-5" />
                FUND WALLET
              </button>
              <button className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center active:scale-95 transition-transform">
                <ArrowUpRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        </motion.section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => {
              setIsFunding(true);
              setPaymentMethod('transfer');
            }}
            className="group bg-surface-container-low p-6 rounded-[2rem] border border-primary/5 flex flex-col gap-4 text-left active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-white transition-colors">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-headline font-black text-sm">Bank Transfer</h4>
              <p className="text-[10px] font-medium text-on-surface-variant">Instant funding via transfer</p>
            </div>
          </button>
          <button 
            onClick={() => {
              setIsFunding(true);
              setPaymentMethod('card');
            }}
            className="group bg-surface-container-low p-6 rounded-[2rem] border border-primary/5 flex flex-col gap-4 text-left active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-headline font-black text-sm">Debit Card</h4>
              <p className="text-[10px] font-medium text-on-surface-variant">Secure card payment</p>
            </div>
          </button>
        </section>

        {/* History */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-black flex items-center gap-3">
                <History className="w-6 h-6 text-primary" />
                Transaction History
              </h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{timeRangeLabel}</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: 'today', label: 'Today' },
                { id: '7d', label: '7 Days' },
                { id: '14d', label: '14 Days' },
                { id: '30d', label: '30 Days' },
                { id: '2m', label: '2 Months' },
                { id: 'custom', label: 'Customize' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTimeRange(opt.id as any)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest transition-all",
                    timeRange === opt.id 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-highest"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {timeRange === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 overflow-hidden"
                >
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-primary">Start Date</label>
                    <input 
                      type="date"
                      value={customRange.start}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-white rounded-lg p-2 text-xs font-bold outline-none border border-primary/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-primary">End Date</label>
                    <input 
                      type="date"
                      value={customRange.end}
                      onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-white rounded-lg p-2 text-xs font-bold outline-none border border-primary/10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <motion.div 
                key={item.id || item._id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTransaction(item)}
                className="bg-surface-container-low p-5 rounded-3xl border border-primary/5 flex items-center gap-5 cursor-pointer hover:bg-white transition-colors group"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                  item.type === 'deposit' || item.type === 'refund' ? "bg-success/10 text-success group-hover:bg-success group-hover:text-white" : "bg-error/10 text-error group-hover:bg-error group-hover:text-white"
                )}>
                  {item.type === 'deposit' || item.type === 'refund' ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-black text-sm">{item.desc}</h4>
                    {item.status === 'disputed' && (
                      <span className="bg-error/10 text-error text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Disputed</span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-on-surface-variant">
                    {(() => {
                      const dateSrc = item.date || item.createdAt;
                      if (!dateSrc) return 'Recently';
                      const d = new Date(dateSrc);
                      if (isNaN(d.getTime())) return 'Recently';
                      return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    })()}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className={cn(
                    "font-headline font-black text-lg",
                    item.type === 'deposit' || item.type === 'refund' ? "text-success" : "text-error"
                  )}>
                    {item.type === 'deposit' || item.type === 'refund' ? '+' : '-'}₦{item.amount.toLocaleString()}
                  </p>
                  <ChevronRight className="w-4 h-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
            {filteredHistory.length === 0 && history.length > 0 && (
              <div className="text-center py-20 bg-surface-container-lowest rounded-[3rem] border-2 border-dashed border-primary/10">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-10 h-10 text-primary/20" />
                </div>
                <h4 className="font-headline font-black text-on-surface">No results found</h4>
                <p className="text-xs font-medium text-on-surface-variant mt-1">Try adjusting your filters to see more transactions.</p>
              </div>
            )}
            {history.length === 0 && (
              <div className="text-center py-20 bg-surface-container-lowest rounded-[3rem] border-2 border-dashed border-primary/10">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-10 h-10 text-primary/20" />
                </div>
                <p className="text-sm font-medium text-on-surface-variant">No transactions yet.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransaction(null)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-surface rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className={cn(
                "w-20 h-20 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center",
                selectedTransaction.type === 'deposit' || selectedTransaction.type === 'refund' ? "bg-success text-white" : "bg-error text-white"
              )}>
                {selectedTransaction.type === 'deposit' || selectedTransaction.type === 'refund' ? <ArrowDownLeft className="w-10 h-10" /> : <ArrowUpRight className="w-10 h-10" />}
              </div>

              <h3 className="text-center font-headline font-black text-2xl text-on-surface mb-1">
                {selectedTransaction.type === 'deposit' || selectedTransaction.type === 'refund' ? '+' : '-'}₦{selectedTransaction.amount.toLocaleString()}
              </h3>
              <p className="text-center font-label text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-8">
                Transaction {selectedTransaction.type}
              </p>

              <div className="space-y-4 pt-8 border-t border-primary/5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Description</span>
                  <span className="text-sm font-headline font-black text-on-surface">{selectedTransaction.desc}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Date</span>
                  <span className="text-sm font-headline font-black text-on-surface">{new Date(selectedTransaction.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Time</span>
                  <span className="text-sm font-headline font-black text-on-surface">{new Date(selectedTransaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Reference</span>
                  <span className="text-[10px] font-mono font-bold text-on-surface-variant">{selectedTransaction.id}</span>
                </div>
                {selectedTransaction.method && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Method</span>
                    <span className="text-sm font-headline font-black text-on-surface uppercase">{selectedTransaction.method}</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-full h-16 bg-surface-container-highest mt-10 rounded-2xl font-headline font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
              >
                Close Details
              </button>

              <button 
                onClick={async () => {
                  const issue = prompt('Please describe the issue with this transaction:');
                  if (issue && user?.uid) {
                    try {
                      const token = localStorage.getItem('qw_token');
                      const resp = await fetch(`/api/transactions/${selectedTransaction.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                          status: 'disputed', 
                          issueDescription: issue 
                        })
                      });
                      if (resp.ok) {
                        const updated = await resp.json();
                        setHistory(prev => prev.map(t => (t.id === selectedTransaction.id || t._id === selectedTransaction.id) ? updated : t));
                        setSelectedTransaction(null);
                        alert('Issue raised successfully. Our support team will review it.');
                      }
                    } catch (err) {
                      alert('Failed to raise issue.');
                    }
                  }
                }}
                className="w-full h-12 bg-error/10 text-error mt-4 rounded-xl font-headline font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform border border-error/10"
              >
                Raise Issue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessView && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[3.5rem] p-10 shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 signature-gradient" />
              
              <motion.div 
                initial={{ rotate: -45, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center text-success mb-8"
              >
                <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/20">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              <h3 className="text-3xl font-headline font-black text-on-surface mb-2">Success!</h3>
              <p className="text-sm font-medium text-on-surface-variant mb-6">
                Your wallet has been credited successfully.
              </p>

              <div className="w-full bg-surface-container-highest/20 rounded-3xl p-6 mb-8 border border-primary/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-1">Amount Funded</p>
                <p className="text-3xl font-headline font-black text-primary">₦{lastFundedAmount.toLocaleString()}</p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => setShowSuccessView(false)}
                  className="w-full h-16 signature-gradient text-white rounded-2xl font-headline font-black text-sm shadow-xl active:scale-95 transition-transform"
                >
                  CONTINUE TO WALLET
                </button>
              </div>

              <div className="mt-8 flex items-center gap-2 px-6 py-2 bg-success/5 rounded-full">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span className="text-[10px] font-black uppercase tracking-widest text-success">Secure Transaction</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Funding Modal */}
      <AnimatePresence>
        {isFunding && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-6 sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsFunding(false);
                setPaymentMethod(null);
              }}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-surface rounded-[3rem] p-10 shadow-2xl"
            >
              <div className="w-16 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-8" />
              <h3 className="text-3xl font-headline font-black text-on-surface mb-2">Fund Wallet</h3>
              <p className="text-sm font-medium text-on-surface-variant mb-8 leading-relaxed">
                Enter the amount you want to add to your Quick-Wash wallet.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 mb-4">
                  <button 
                    onClick={() => setPaymentMethod('transfer')}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      paymentMethod === 'transfer' ? "bg-primary/5 border-primary text-primary" : "bg-surface-container border-primary/5 text-on-surface-variant"
                    )}
                  >
                    <Landmark className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Transfer</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      paymentMethod === 'card' ? "bg-primary/5 border-primary text-primary" : "bg-surface-container border-primary/5 text-on-surface-variant"
                    )}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Card</span>
                  </button>
                </div>

                {paymentMethod === 'transfer' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-warning/10 rounded-2xl border border-warning/20 mb-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-warning-dark uppercase tracking-widest mb-1 text-primary">Transfer to:</p>
                        <p className="text-sm font-bold text-on-surface">Kuda Bank</p>
                        <p className="text-xl font-headline font-black text-on-surface">2031194566</p>
                        <p className="text-xs font-medium text-on-surface-variant mb-4">Name: Quick-Wash Laundry</p>
                        
                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                          <p className="text-[8px] font-black uppercase text-primary mb-1">IMPORTANT: USE THIS NARRATION</p>
                          <p className="text-sm font-mono font-bold text-on-surface">{user?.transferReference || 'QW-REF-MISSING'}</p>
                          <p className="text-[7px] font-medium text-on-surface-variant mt-1">This helps us identify your payment instantly.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const ref = user?.transferReference || 'QW-REF-MISSING';
                          navigator.clipboard.writeText(`Acc: 2031194566, Ref: ${ref}`);
                          alert('Account and Reference copied!');
                        }}
                        className="p-2 bg-white rounded-lg shadow-sm active:scale-90 transition-transform"
                      >
                         <Bolt className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                    <p className="text-[9px] font-medium text-on-surface-variant italic">
                      Transfer the exact amount and enter it below. Your wallet will be funded once the system detects the payment with your reference.
                    </p>
                  </motion.div>
                )}

                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-headline font-black text-primary">₦</span>
                  <input 
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-20 bg-surface-container-low rounded-2xl pl-14 pr-6 text-3xl font-headline font-black text-on-surface focus:ring-4 ring-primary/10 outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1000, 2000, 5000].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setFundAmount(amt.toString())}
                      className="h-12 rounded-xl bg-primary/5 text-primary font-headline font-black text-xs hover:bg-primary/10 transition-colors"
                    >
                      +₦{amt.toLocaleString()}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleFundWallet}
                  disabled={isProcessing || !fundAmount || !paymentMethod}
                  className="w-full h-20 bg-primary text-on-primary rounded-[2rem] font-headline font-black text-xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <Plus className="w-6 h-6" />
                      ADD FUNDS
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
