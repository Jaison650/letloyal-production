'use client';

import { Spinner } from './ui';
import QRScanner from '@/components/QRScanner';
import type { Tab } from './types';

interface ScanResult {
  points_added: number; progress: number; threshold: number;
  reward_unlocked: boolean; reward_description: string; business_name: string;
}

// ── Scan tab ──────────────────────────────────────────────────────────────────
export default function ScanTab({
  tab, scanResult, setScanResult, scanLoading, scanError, setScanError, handleQRScan,
}: {
  tab: Tab;
  scanResult: ScanResult | null;
  setScanResult: (v: ScanResult | null) => void;
  scanLoading: boolean;
  scanError: string;
  setScanError: (v: string) => void;
  handleQRScan: (data: string) => void;
}) {
  return (
    <div className="space-y-4">
      {!scanResult && (
        <>
          <p className="text-sm text-text-medium text-center">Point your camera at a LetLoyal store QR code.</p>
          <QRScanner
            active={tab === 'scan'}
            onScan={handleQRScan}
            onError={(msg) => setScanError(msg)}
          />
          {scanLoading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Spinner sm />
              <p className="text-sm text-text-medium">Processing…</p>
            </div>
          )}
          {scanError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
              {scanError}
              <button
                onClick={() => setScanError('')}
                className="block mx-auto mt-2 text-red-400 hover:text-red-600 text-xs"
              >
                Try again
              </button>
            </div>
          )}
        </>
      )}
      {scanResult && (
        <div className="bg-white rounded-2xl border border-border-light p-8 text-center space-y-2">
          <div className="text-5xl mb-3">{scanResult.reward_unlocked ? '🏆' : '🎉'}</div>
          <p className="text-xl font-bold text-text-dark">+{scanResult.points_added} {scanResult.points_added === 1 ? 'stamp' : 'stamps'}!</p>
          <p className="text-text-medium text-sm">{scanResult.business_name}</p>
          {scanResult.reward_unlocked ? (
            <p className="text-sm font-semibold text-primary mt-1">🎁 Reward unlocked: {scanResult.reward_description}</p>
          ) : (
            <p className="text-text-light text-sm mt-1">{scanResult.progress} / {scanResult.threshold} towards your reward</p>
          )}
          <button
            onClick={() => { setScanResult(null); setScanError(''); }}
            className="mt-6 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Scan another store
          </button>
        </div>
      )}
    </div>
  );
}
