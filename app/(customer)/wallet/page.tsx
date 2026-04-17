'use client';

import React from 'react';
import TopAppBar from '@/components/shared/TopAppBar';
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, History, CreditCard, Landmark, ShieldCheck, ChevronRight, Bolt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = React.useState(0);
  const [history, setHistory] = React.useState<any[]>([]);
  const [isFunding, setIsFunding] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'wallet' | 'transfer' | 'card'>('wallet');
  const [fundAmount, setFundAmount] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (user?.phoneNumber) {
      const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
      const found = allUsers.find((u: any) => u.phoneNumber === user.phoneNumber);
      setBalance(found?.walletBalance || 0);
      
      const allHistory = JSON.parse(localStorage.getItem(`qw_wallet_history_${user.phoneNumber}`) || '[]');
      setHistory(allHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, [user]);

  const handleFundWallet = React.useCallback(async () => {
    if (!fundAmount || isNaN(Number(fundAmount)) || Number(fundAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const amount = Number(fundAmount);
    const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
    const updatedUsers = allUsers.map((u: any) => {
      if (u.phoneNumber === user?.phoneNumber) {
        const newBalance = (u.walletBalance || 0) + amount;
        const updated = { ...u, walletBalance: newBalance };
        localStorage.setItem('qw_user', JSON.stringify(updated));
        setBalance(newBalance);
        return updated;
      }
      return u;
    });
    localStorage.setItem('qw_all_users', JSON.stringify(updatedUsers));

    // Record History
    const newHistory = {
      id: `fund_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: 'deposit',
      amount,
      date: new Date().toISOString(),
      desc: 'Wallet Funding'
    };
    const currentHistory = JSON.parse(localStorage.getItem(`qw_wallet_history_${user?.phoneNumber}`) || '[]');
    const updatedHistory = [newHistory, ...currentHistory];
    localStorage.setItem(`qw_wallet_history_${user?.phoneNumber}`, JSON.stringify(updatedHistory));
    setHistory(updatedHistory);

    setIsProcessing(false);
    setIsFunding(false);
    setFundAmount('');
    alert(`₦${amount.toLocaleString()} added to your wallet!`);
  }, [user, fundAmount]);

  return (
    <div className="pb-32">
      <TopAppBar title="My Wallet" showAudioToggle />

      <main className="pt-8 px-6 max-w-2xl mx-auto space-y-8">
        {/* Balance Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary p-10 rounded-[3rem] text-on-primary shadow-2xl shadow-primary/20 relative overflow-hidden group"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 opacity-80 mb-4">
              <Wallet className="w-5 h-5" />
              <span className="font-label text-xs font-black uppercase tracking-[0.3em]">Available Balance</span>
            </div>
            <h2 className="text-6xl font-headline font-black tracking-tighter mb-10">
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
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-headline font-black flex items-center gap-3">
              <History className="w-6 h-6 text-primary" />
              Transaction History
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Last 30 days</span>
          </div>

          <div className="space-y-3">
            {history.map((item) => (
              <div 
                key={item.id}
                className="bg-surface-container-low p-5 rounded-3xl border border-primary/5 flex items-center gap-5"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                  item.type === 'deposit' ? "bg-success/10 text-success" : "bg-error/10 text-error"
                )}>
                  {item.type === 'deposit' ? <ArrowDownLeft className="w-7 h-7" /> : <ArrowUpRight className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-headline font-black text-sm">{item.desc}</h4>
                  <p className="text-[10px] font-bold text-on-surface-variant">{new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-headline font-black text-lg",
                    item.type === 'deposit' ? "text-success" : "text-error"
                  )}>
                    {item.type === 'deposit' ? '+' : '-'}₦{item.amount.toLocaleString()}
                  </p>
                  <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Successful</span>
                </div>
              </div>
            ))}
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

      {/* Funding Modal */}
      <AnimatePresence>
        {isFunding && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-6 sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFunding(false)}
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
                        <p className="text-xs font-medium text-on-surface-variant">Name: Quick-Wash Laundry</p>
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText('2031194566');
                          alert('Account number copied!');
                        }}
                        className="p-2 bg-white rounded-lg shadow-sm active:scale-90 transition-transform"
                      >
                         <Bolt className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                    <p className="text-[9px] font-medium text-on-surface-variant italic">
                      Transfer the exact amount and enter it below. Your wallet will be funded once the system detects the payment.
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
                  disabled={isProcessing || !fundAmount}
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
