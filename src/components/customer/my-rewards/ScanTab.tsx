'use client';

import { Spinner } from './ui';
import QRScanner from '@/components/QRScanner';
import EarnResult from '../EarnResult';
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
          <p className="text-sm text-ink-sub text-center">Point your camera at a LetLoyal store QR code.</p>
          <QRScanner
            active={tab === 'scan'}
            onScan={handleQRScan}
            onError={(msg) => setScanError(msg)}
          />
          {scanLoading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Spinner sm />
              <p className="text-sm text-ink-sub">Processing…</p>
            </div>
          )}
          {scanError && (
            <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad text-center">
              {scanError}
              <button
                onClick={() => setScanError('')}
                className="block mx-auto mt-2 text-bad/70 hover:text-bad text-xs"
              >
                Try again
              </button>
            </div>
          )}
        </>
      )}
      {scanResult && (
        <div className="space-y-4">
          <EarnResult
            pointsAdded={scanResult.points_added}
            progress={scanResult.progress}
            threshold={scanResult.threshold}
            rewardUnlocked={scanResult.reward_unlocked}
            rewardDescription={scanResult.reward_description}
            businessName={scanResult.business_name}
          />
          <button
            onClick={() => { setScanResult(null); setScanError(''); }}
            className="w-full bg-teal hover:bg-teal-hover text-teal-fg font-semibold py-3 rounded-full transition-colors"
          >
            Scan another store
          </button>
        </div>
      )}
    </div>
  );
}
