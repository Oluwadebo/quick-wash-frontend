'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, CreditCard, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/ApiService';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  userId: string;
  onSuccess: () => void;
  initialBankData?: {
    bankName: string;
    accountNumber: string;
    fullName: string;
  };
}

export default function WithdrawalModal({ 
  isOpen, 
  onClose, 
  balance, 
  userId, 
  onSuccess,
  initialBankData 
}: WithdrawalModalProps) {
  const [step, setStep] = React.useState(1);
  const [amount, setAmount] = React.useState('');
  const [accountDetails, setAccountDetails] = React.useState({
    bankName: initialBankData?.bankName || '',
    accountNumber: initialBankData?.accountNumber || '',
    accountName: initialBankData?.fullName || ''
  });
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleWithdraw = async () => {
    if (!amount || Number(amount) < 2000) {
      setError('Minimum withdrawal is ₦2,000');
      return;
    }
    if (Number(amount) > balance) {
      setError('Insufficient balance');
      return;
    }
    if (!accountDetails.bankName || !accountDetails.accountNumber || !accountDetails.accountName) {
      setError('All bank details are required');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const success = await api.withdraw({
        userId,
        amount: Number(amount),
        ...accountDetails
      });

      if (success) {
        setStep(3);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Withdrawal failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface/80 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-primary/10 overflow-hidden"
          >
            <div className="p-8 border-b border-primary/5 flex justify-between items-center bg-surface-container-lowest">
              <div>
                <h3 className="text-2xl font-headline font-black text-on-surface">Withdrawal</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Secure Transfer</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-error/10 hover:text-error transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Available Balance</p>
                    <h4 className="text-3xl font-headline font-black text-on-surface">₦{(Number(balance) || 0).toLocaleString()}</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Amount to Withdraw (Min ₦2,000)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 font-headline font-black text-xl text-on-surface-variant">₦</span>
                        <input 
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-16 bg-surface-container-lowest rounded-2xl pl-12 pr-6 font-headline font-black text-2xl outline-none focus:ring-2 ring-primary border border-primary/5"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setStep(2)}
                      disabled={!amount || Number(amount) < 2000 || Number(amount) > balance}
                      className="w-full h-16 bg-primary text-white rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                      NEXT STEP <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Bank Name</label>
                      <div className="relative">
                        <Landmark className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                        <input 
                          type="text"
                          value={accountDetails.bankName}
                          onChange={(e) => setAccountDetails({...accountDetails, bankName: e.target.value})}
                          placeholder="e.g. Access Bank"
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-2 ring-primary border border-primary/5"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Account Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-50" />
                        <input 
                          type="text"
                          maxLength={10}
                          value={accountDetails.accountNumber}
                          onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value.replace(/\D/g, '')})}
                          placeholder="0123456789"
                          className="w-full h-14 bg-surface-container-lowest rounded-2xl pl-14 pr-6 font-headline font-bold outline-none focus:ring-2 ring-primary border border-primary/5"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Account Name (Full Name)</label>
                      <input 
                        type="text"
                        value={accountDetails.accountName}
                        onChange={(e) => setAccountDetails({...accountDetails, accountName: e.target.value})}
                        placeholder="John Doe"
                        className="w-full h-14 bg-surface-container-lowest rounded-2xl px-6 font-headline font-bold outline-none focus:ring-2 ring-primary border border-primary/5"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-error/5 border border-error/10 rounded-2xl flex items-center gap-2 text-error text-[10px] font-black uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex-1 h-16 bg-surface-container-highest text-on-surface rounded-2xl font-headline font-black text-sm"
                    >
                      BACK
                    </button>
                    <button 
                      onClick={handleWithdraw}
                      disabled={isProcessing}
                      className="flex-[2] h-16 bg-primary text-white rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                    >
                      {isProcessing ? 'PROCESSING...' : `WITHDRAW ₦${Number(amount).toLocaleString()}`}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h4 className="text-2xl font-headline font-black text-on-surface mb-2">Request Submitted!</h4>
                  <p className="text-on-surface-variant font-medium">Your withdrawal was successful. You will receive ₦{Number(amount).toLocaleString()} shortly.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
