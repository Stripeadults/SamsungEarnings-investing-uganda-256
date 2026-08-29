import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Loader2, Database, ArrowRight, X } from 'lucide-react';
import { hasPendingMigration, runMigration, skipMigration, MigrationStats } from '@/lib/migrate';

type Phase = 'idle' | 'prompt' | 'running' | 'done' | 'error';

const MigrationBanner = () => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (hasPendingMigration()) {
      setPhase('prompt');
    }
  }, []);

  const handleMigrate = useCallback(async () => {
    setPhase('running');
    setProgress(0);
    setStep('Starting migration…');

    const result = await runMigration((s, pct) => {
      setStep(s);
      setProgress(pct);
    });

    if (result.errors.length > 0) {
      setErrorMsg(result.errors.join('\n'));
      setPhase('error');
    } else {
      setStats(result);
      setPhase('done');
    }
  }, []);

  const handleSkip = () => {
    skipMigration();
    setPhase('idle');
  };

  if (phase === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl pb-8 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ background: 'linear-gradient(135deg, #0a0f2e, #1d4ed8)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-white font-bold text-base">Cloud Migration</div>
              <div className="text-blue-200 text-xs mt-0.5">Move your data to the cloud</div>
            </div>
          </div>
        </div>

        {/* Prompt */}
        {phase === 'prompt' && (
          <div className="px-6 pt-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="text-amber-800 font-semibold text-sm mb-1">📦 Local Data Detected</div>
              <p className="text-amber-700 text-sm leading-relaxed">
                We found data saved on this device from the old system. Migrate it to the cloud so it&apos;s accessible from any device and never lost.
              </p>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Users, products, recharges & withdrawals</div>
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Wallets, notifications & redeem codes</div>
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Old local copy removed after migration</div>
              <div className="flex items-center gap-2"><span className="text-green-500">✓</span> One-time process — runs only once</div>
            </div>
            <button
              onClick={handleMigrate}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
            >
              Migrate to Cloud <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-medium"
            >
              Skip — I have no important local data
            </button>
          </div>
        )}

        {/* Running */}
        {phase === 'running' && (
          <div className="px-6 pt-6 space-y-5">
            <div className="flex flex-col items-center py-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <div className="text-gray-800 font-bold text-base mb-1">Migrating Data…</div>
              <div className="text-gray-500 text-sm text-center">{step}</div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span className="font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)' }}
                />
              </div>
            </div>
            <p className="text-gray-400 text-xs text-center pb-2">Please keep this window open…</p>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && stats && (
          <div className="px-6 pt-5 space-y-4">
            <div className="flex flex-col items-center py-3">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div className="text-gray-800 font-bold text-lg">Migration Complete!</div>
              <div className="text-gray-500 text-sm mt-1">Your data is now safe in the cloud.</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Users', count: stats.users, icon: '👤' },
                { label: 'Products', count: stats.products, icon: '📦' },
                { label: 'Recharges', count: stats.recharges, icon: '💰' },
                { label: 'Withdrawals', count: stats.withdrawals, icon: '💸' },
                { label: 'Wallets', count: stats.wallets, icon: '📲' },
                { label: 'Notifications', count: stats.notifications, icon: '🔔' },
              ].map(({ label, count, icon }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <div className="text-gray-800 font-bold text-sm">{count}</div>
                    <div className="text-gray-400 text-xs">{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPhase('idle')}
              className="w-full py-4 rounded-2xl text-white font-bold text-base active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
            >
              ✓ Continue to App
            </button>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="px-6 pt-5 space-y-4">
            <div className="flex flex-col items-center py-3">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <AlertCircle className="w-9 h-9 text-red-500" />
              </div>
              <div className="text-gray-800 font-bold text-lg">Migration Failed</div>
              <div className="text-gray-500 text-sm mt-1 text-center">Some records could not be uploaded.</div>
            </div>
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 max-h-32 overflow-y-auto">
                <pre className="text-red-600 text-xs whitespace-pre-wrap">{errorMsg}</pre>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleMigrate}
                className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm active:scale-95 transition-transform"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)' }}
              >
                Retry
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationBanner;
