import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// paste your other imports here (keep as they were)
// import { formatUGX, generateId, MIN_WITHDRAW } etc

const handleWithdraw = async () => {
    if (loading) return;
    const withdrawAmount = Number(amount);
    if (!hasBought) { toast.error('You must buy a package first to withdraw'); return; }
    if (!selectedWallet) { toast.error('Please add a wallet'); navigate('/wallet'); return; }
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) { toast.error(`Minimum withdraw is ${formatUGX(MIN_WITHDRAW)}`); return; }

    setLoading(true);
    try {
      // 1. Get REAL balance from DB (only for checking, NOT deducting)
      const { data: freshUser } = await supabase.from('samsung_users').select('balance').eq('id', user.id).single();
      const realBalance = Number(freshUser?.balance || 0);

      if (withdrawAmount > realBalance) {
        toast.error(`Insufficient balance. You have ${formatUGX(realBalance)}`);
        setUser((prev:any) => ({...prev, balance: realBalance}));
        setLoading(false);
        return;
      }

      const wallet = wallets.find((w:any) => w.id === selectedWallet);
      if (!wallet) { toast.error('Wallet not found'); setLoading(false); return; }
      
      const tax = Math.round(withdrawAmount * 0.10);
      const net = withdrawAmount - tax;

      // 2. NO DEDUCT HERE - Only create pending record (balance stays 10,000)
      const { error: insertError } = await supabase.from('samsung_withdrawals').insert([{
        id: generateId(),
        user_id: user.id,
        user_name: user.name,
        user_phone: user.phone,
        amount: withdrawAmount,
        net_amount: net,
        wallet_type: wallet.type,
        wallet_phone: wallet.phone,
        wallet_name: wallet.name,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

      if (insertError) throw insertError;

      toast.success('Withdrawal submitted! Awaiting admin approval - balance will deduct after approval');
      setAmount('');
      navigate('/records');

    } catch (e) {
      console.log(e);
      toast.error('Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };
