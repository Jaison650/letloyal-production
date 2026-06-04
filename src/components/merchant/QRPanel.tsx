'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { RefreshCw, X, QrCode, IndianRupee } from 'lucide-react';
import { clsx } from 'clsx';

interface QRPanelProps {
  slug:          string;
  campaignType:  'visit_based' | 'spend_based';
  speedDials:    number[];
}

type PanelState =
  | 'idle'          // spend-based: waiting for amount selection
  | 'generating'    // fetching QR from API
  | 'ready'         // QR displayed, polling active
  | 'scanned'       // just used — brief success flash
  | 'expired'       // safety_expiry passed without scan
  | 'error';        // generation failed

interface ActiveQR {
  token:        string;
  qrDataUrl:    string;
  safetyExpiry: string;
  amountRupees: number | null;
}

const POLL_INTERVAL_MS = 2000;

export default function QRPanel({ slug, campaignType, speedDials }: QRPanelProps) {
  const [state,     setState]     = useState<PanelState>(
    campaignType === 'visit_based' ? 'generating' : 'idle',
  );
  const [activeQR,  setActiveQR]  = useState<ActiveQR | null>(null);
  const [customAmt, setCustomAmt] = useState('');
  const [errorMsg,  setErrorMsg]  = useState('');

  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── Auto-generate for visit-based on mount ────────────────────────────
  useEffect(() => {
    if (campaignType === 'visit_based') {
      generateQR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stop polling helper ───────────────────────────────────────────────
  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // ── Start polling helper ──────────────────────────────────────────────
  const startPolling = useCallback((token: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/merchant/${slug}/qr/${token}/status`);
        if (!res.ok || !mountedRef.current) return;
        const data = await res.json();

        if (data.status === 'used') {
          stopPolling();
          if (!mountedRef.current) return;
          setState('scanned');

          if (campaignType === 'visit_based') {
            // Burst mode: auto-regenerate after brief success flash
            setTimeout(() => {
              if (mountedRef.current) generateQR();
            }, 1500);
          } else {
            // Spend-based: return to amount selector after flash
            setTimeout(() => {
              if (mountedRef.current) {
                setActiveQR(null);
                setState('idle');
              }
            }, 2000);
          }
        } else if (data.status === 'expired' || data.status === 'revoked') {
          stopPolling();
          if (!mountedRef.current) return;
          setState('expired');
          setActiveQR(null);
        }
      } catch {
        // Polling failures are silent — retry on next tick
      }
    }, POLL_INTERVAL_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, campaignType]);

  // ── Generate QR ───────────────────────────────────────────────────────
  async function generateQR(amountRupees?: number) {
    stopPolling();
    setState('generating');
    setErrorMsg('');
    setActiveQR(null);

    try {
      const body: Record<string, unknown> = {};
      if (campaignType === 'spend_based' && amountRupees) {
        body.amount_rupees = amountRupees;
      }

      const res  = await fetch(`/api/merchant/${slug}/qr/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!mountedRef.current) return;

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error || "Couldn't generate QR — try again.");
        return;
      }

      const qr: ActiveQR = {
        token:        data.token,
        qrDataUrl:    data.qr_data_url,
        safetyExpiry: data.safety_expiry,
        amountRupees: data.amount_rupees ?? null,
      };

      setActiveQR(qr);
      setState('ready');
      startPolling(qr.token);
    } catch {
      if (!mountedRef.current) return;
      setState('error');
      setErrorMsg("Couldn't generate QR — check your connection and try again.");
    }
  }

  // ── Revoke active QR ──────────────────────────────────────────────────
  async function revokeQR() {
    if (!activeQR) return;
    stopPolling();
    await fetch(`/api/merchant/${slug}/qr/${activeQR.token}`, { method: 'DELETE' }).catch(() => {});
    setActiveQR(null);
    if (campaignType === 'visit_based') {
      generateQR();
    } else {
      setState('idle');
    }
  }

  // ── Render: scanned flash ─────────────────────────────────────────────
  if (state === 'scanned') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <span className="text-4xl">✓</span>
        </div>
        <p className="text-xl font-bold text-green-700">Scanned!</p>
        {campaignType === 'visit_based' && (
          <p className="text-sm text-text-medium">Generating next QR…</p>
        )}
      </div>
    );
  }

  // ── Render: generating spinner ────────────────────────────────────────
  if (state === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-text-medium text-sm">Generating QR…</p>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <X size={24} className="text-status-error" />
        </div>
        <p className="text-status-error font-semibold">{errorMsg}</p>
        <Button onClick={() => generateQR()} variant="secondary" size="sm">
          <RefreshCw size={14} /> Try Again
        </Button>
      </div>
    );
  }

  // ── Render: expired ───────────────────────────────────────────────────
  if (state === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
          <QrCode size={24} className="text-yellow-600" />
        </div>
        <p className="font-semibold text-text-dark">QR expired</p>
        <p className="text-sm text-text-medium">This QR was not scanned in time.</p>
        <Button
          onClick={() => campaignType === 'visit_based' ? generateQR() : setState('idle')}
          size="sm"
        >
          <RefreshCw size={14} /> Generate New QR
        </Button>
      </div>
    );
  }

  // ── Render: active QR (ready state) ──────────────────────────────────
  if (state === 'ready' && activeQR) {
    return (
      <div className="flex flex-col items-center gap-5">

        {/* Amount badge for spend-based */}
        {activeQR.amountRupees && (
          <div className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-full text-lg font-bold shadow-btn">
            <IndianRupee size={18} />
            {activeQR.amountRupees.toLocaleString('en-IN')}
          </div>
        )}

        {/* QR code image */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border-light bg-white p-3">
          <Image
            src={activeQR.qrDataUrl}
            alt="Scan QR code"
            width={280}
            height={280}
            priority
            unoptimized
          />
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm text-text-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          {campaignType === 'visit_based'
            ? 'Ready — show to customer to scan'
            : 'Waiting for customer to scan…'}
        </div>

        {/* Cancel / revoke */}
        <button
          onClick={revokeQR}
          className="flex items-center gap-1.5 text-sm text-text-light hover:text-status-error transition-colors"
        >
          <X size={14} />
          {campaignType === 'visit_based' ? 'Cancel & regenerate' : 'Cancel QR'}
        </button>
      </div>
    );
  }

  // ── Render: idle (spend-based amount selector) ────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-text-dark mb-3">Quick amounts</p>
        <div className="grid grid-cols-2 gap-3">
          {speedDials.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => generateQR(amount)}
              className={clsx(
                'flex items-center justify-center gap-1.5 py-4 rounded-xl border-2 border-primary',
                'text-primary font-bold text-lg transition-all',
                'hover:bg-primary hover:text-white active:scale-95',
              )}
            >
              <IndianRupee size={16} />
              {amount.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div>
        <p className="text-sm font-semibold text-text-dark mb-2">Custom amount</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="number"
              value={customAmt}
              onChange={(e) => setCustomAmt(e.target.value)}
              placeholder="Enter amount"
              min={1}
              step={1}
              className="form-input pl-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customAmt && Number(customAmt) > 0) {
                  generateQR(Number(customAmt));
                }
              }}
            />
          </div>
          <Button
            onClick={() => {
              const amt = Number(customAmt);
              if (amt > 0) generateQR(amt);
            }}
            disabled={!customAmt || Number(customAmt) <= 0}
            size="md"
          >
            Generate
          </Button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-sm text-status-error text-center">{errorMsg}</p>
      )}
    </div>
  );
}
