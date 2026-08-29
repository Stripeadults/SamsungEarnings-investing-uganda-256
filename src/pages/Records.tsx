import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { getCurrentUser, getUserWithdrawals, getUserRecharges } from '@/lib/storage';
import { formatUGX, formatDateTime } from '@/lib/utils';
import { Recharge } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  approved: 'text-green-600 bg-green-50',
  rejected: 'text-red-600 bg-red-50',
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'approved') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
};

const Records = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'withdrawal' | 'recharge'>('withdrawal');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);

    Promise.all([getUserWithdrawals(u.id), getUserRecharges(u.id)]).then(([ws, rs]) => {
      setWithdrawals([...ws].reverse());
      setRecharges([...rs].reverse());
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="app-container min-h-screen bg-gray-50">
      <div className="flex items-center px-4 py-4 bg-white border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
        <h1 className="text-gray-800 font-bold text-lg">Records</h1>
      </div>

      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Total Earnings', value: user?.totalEarnings || 0, color: 'text-blue-600' },
          { label: 'Total Withdrawn', value: user?.totalWithdrawal || 0, color: 'text-green-600' },
          { label: 'Referral Earnings', value: user?.referralEarnings || 0, color: 'text-amber-600' },
          { label: 'Daily Earnings', value: user?.dailyEarnings || 0, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="text-gray-400 text-xs">{label}</div>
            <div className={`${color} font-bold text-base mt-0.5`}>{formatUGX(value)}</div>
          </div>
        ))}
      </div>

      <div className="mx-4 bg-gray-100 rounded-2xl p-1 flex mb-4">
        <button onClick={() => setTab('withdrawal')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'withdrawal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Withdrawals</button>
        <button onClick={() => setTab('recharge')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tab === 'recharge' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>Recharges</button>
      </div>

      <div className="px-4 space-y-3 pb-6">
        {tab === 'withdrawal' && (
          withdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No withdrawal records yet</div>
          ) : withdrawals.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-gray-800 font-bold text-base">{formatUGX(w.amount)}</div>
                  <div className="text-gray-400 text-xs mt-0.5">Net: {formatUGX(w.netAmount)} (after 18% tax)</div>
                  <div className="text-gray-500 text-xs mt-1">{w.walletType === 'mtn' ? '📲 MTN' : '📱 Airtel'} • {w.walletPhone}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${statusColors[w.status]}`}>{w.status}</span>
              </div>
              <div className="text-gray-300 text-xs mt-2">{formatDateTime(w.createdAt)}</div>
            </div>
          ))
        )}

        {tab === 'recharge' && (() => {
          const pendingCount = recharges.filter((r: Recharge) => r.status === 'pending').length;
          const approvedTotal = recharges.filter((r: Recharge) => r.status === 'approved').reduce((s: number, r: Recharge) => s + r.amount, 0);
          return (
            <>
              {recharges.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
                    <div className="text-blue-600 font-bold text-lg">{recharges.length}</div>
                    <div className="text-gray-400 text-[10px] font-medium mt-0.5">Total</div>
                  </div>
                  <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
                    <div className="text-amber-500 font-bold text-lg">{pendingCount}</div>
                    <div className="text-gray-400 text-[10px] font-medium mt-0.5">Pending</div>
                  </div>
                  <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
                    <div className="text-green-600 font-bold text-sm">{formatUGX(approvedTotal)}</div>
                    <div className="text-gray-400 text-[10px] font-medium mt-0.5">Approved</div>
                  </div>
                </div>
              )}

              {recharges.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">💳</div>
                  <div className="text-gray-500 font-medium text-sm">No recharge records yet</div>
                  <div className="text-gray-400 text-xs mt-1">Your recharge history will appear here</div>
                </div>
              ) : (
                recharges.map((r: Recharge) => {
                  const isMTN = r.network === 'mtn';
                  return (
                    <div key={r.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
                      r.status === 'approved' ? 'border-green-400' :
                      r.status === 'rejected' ? 'border-red-400' : 'border-amber-400'
                    }`}>
                      {/* Top row */}
                      <div className="flex items-start justify-between px-4 pt-4 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0 ${isMTN ? 'bg-yellow-400' : 'bg-red-500'}`}>
                            {isMTN ? 'M' : 'A'}
                          </div>
                          <div>
                            <div className="text-gray-800 font-bold text-base leading-tight">{formatUGX(r.amount)}</div>
                            <div className={`text-xs font-semibold mt-0.5 ${isMTN ? 'text-yellow-600' : 'text-red-600'}`}>
                              {isMTN ? 'MTN Mobile Money' : 'Airtel Money'}
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColors[r.status]}`}>
                          <StatusIcon status={r.status} />
                          {r.status}
                        </div>
                      </div>

                      {/* Sender info */}
                      <div className="mx-4 mb-3 bg-gray-50 rounded-xl px-3 py-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs">Sender Phone</span>
                          <span className="text-gray-700 text-xs font-semibold">{r.senderPhone}</span>
                        </div>
                        {r.senderName && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-xs">Sender Name</span>
                            <span className="text-gray-700 text-xs font-semibold">{r.senderName}</span>
                          </div>
                        )}
                        {r.proof && (
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-gray-400 text-xs shrink-0">Reference</span>
                            <span className="text-gray-600 text-xs font-medium text-right break-all">{r.proof}</span>
                          </div>
                        )}
                      </div>

                      {/* Date timeline */}
                      <div className="mx-4 mb-4 flex items-start gap-3">
                        <div className="flex-1">
                          <div className="text-gray-400 text-[10px] font-medium uppercase tracking-wide">Submitted</div>
                          <div className="text-gray-600 text-xs font-semibold mt-0.5">{formatDateTime(r.createdAt)}</div>
                        </div>
                        {r.processedAt ? (
                          <div className="flex-1">
                            <div className={`text-[10px] font-medium uppercase tracking-wide ${
                              r.status === 'approved' ? 'text-green-500' : 'text-red-400'
                            }`}>{r.status === 'approved' ? 'Approved' : 'Rejected'}</div>
                            <div className="text-gray-600 text-xs font-semibold mt-0.5">{formatDateTime(r.processedAt)}</div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="text-amber-500 text-[10px] font-medium uppercase tracking-wide flex items-center gap-1">
                              <RefreshCw className="w-2.5 h-2.5" /> Awaiting Review
                            </div>
                            <div className="text-gray-400 text-xs mt-0.5">Admin will process soon</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default Records;
