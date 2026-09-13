import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const FIX_DATA = [
  { id: 'galaxy-a05', name: 'Galaxy A05', income: 3000, price: 30000 },
  { id: 'galaxy-a15', name: 'Galaxy A15', income: 7000, price: 70000 },
  { id: 'galaxy-a25', name: 'Galaxy A25', income: 12500, price: 125000 },
  { id: 'galaxy-a35', name: 'Galaxy A35', income: 26000, price: 260000 },
  { id: 'galaxy-a55', name: 'Galaxy A55', income: 40000, price: 400000 },
  { id: 'galaxy-s23-fe', name: 'Galaxy S23 FE', income: 90000, price: 900000 },
  { id: 'galaxy-s24', name: 'Galaxy S24', income: 160000, price: 1600000 },
  { id: 'galaxy-s24-plus', name: 'Galaxy S24+', income: 280200, price: 2802000 },
  { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra', income: 450000, price: 4500000 },
  { id: 'galaxy-z-flip6', name: 'Galaxy Z Flip6', income: 500000, price: 5000000 },
  { id: 'galaxy-z-fold6', name: 'Galaxy Z Fold6', income: 700000, price: 7000000 },
];

export default function FixIncomes() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    setLogs(['Starting fix... Wait...']);
    for (const pkg of FIX_DATA) {
      const { error } = await supabase
        .from('samsung_products')
        .update({ daily_income: pkg.income, package_price: pkg.price })
        .eq('package_id', pkg.id);
      
      if (error) {
        setLogs(p => [...p, `❌ ${pkg.name}: ${error.message}`]);
      } else {
        setLogs(p => [...p, `✅ ${pkg.name} -> ${pkg.income.toLocaleString()} UGX (10%)`]);
      }
    }
    setLogs(p => [...p, '🎉 DONE! All fixed to 10% LOCKED! Now delete this page.']);
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', background: 'white', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>Fix Poison to 10%</h1>
      <p style={{ marginTop: '8px', color: '#666' }}>This will fix all old products in DB</p>
      <button
        onClick={handleFix}
        disabled={loading}
        style={{ marginTop: '20px', width: '100%', padding: '16px', background: '#2563eb', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
      >
        {loading ? 'Fixing...' : '🔧 FIX NOW TO 10%'}
      </button>
      <div style={{ marginTop: '20px', background: '#f3f4f6', padding: '16px', borderRadius: '12px' }}>
        {logs.map((l, i) => <div key={i} style={{ fontSize: '14px', marginBottom: '6px' }}>{l}</div>)}
      </div>
    </div>
  );
}
