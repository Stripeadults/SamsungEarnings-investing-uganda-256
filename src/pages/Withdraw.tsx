const handleWithdraw = async () => {
    if (loading) return;
    const withdrawAmount = Number(amount);
    if (!hasBought) { toast.error('You must buy a package first to withdraw'); return; }
    if (!selectedWallet) { toast.error('Please add a wallet'); navigate('/wallet'); return; }
    if (!withdrawAmount || withdrawAmount < MIN_WITHDRAW) { toast.error(`Minimum withdraw is ${formatUGX(MIN_WITHDRAW)}`); return; }

    setLoading(true);
    try {
      // 1. Get REAL balance from DB
      const { data: freshUser } = await supabase.from('samsung_users').select('balance, total_withdrawal').eq('id', user.id).single();
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

      // 2. ATOMIC DEDUCT - this CANNOT go negative because of .gte()
      const { data: updated, error: updateError } = await supabase.from('samsung_users')
        .update({ 
          balance: realBalance - withdrawAmount,
          total_withdrawal: (freshUser.total_withdrawal || 0) + withdrawAmount
        })
        .eq('id', user.id)
        .gte('balance', withdrawAmount) // <- KEY FIX
        .select()
        .single();

      if (updateError || !updated) {
        toast.error(`Insufficient balance. You have ${formatUGX(realBalance)}`);
        return;
      }

      // 3. Create record only AFTER balance deducted
      await supabase.from('samsung_withdrawals').insert([{
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

      toast.success('Withdrawal submitted!');
      setUser((prev:any) => ({...prev, balance: updated.balance}));
      setAmount('');
      navigate('/records');

    } catch (e) {
      console.log(e);
      toast.error('Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };
