'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { RefreshCw, X, QrCode, IndianRupee, Pencil, Plus, Trash2, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface QRPanelProps {
  slug:          string;
  campaignType:  'visit_based' | 'spend_based';
  speedDials:    number[];
}

type PanelState =
  | 'idle'
  | 'generating'
  | 'ready'
  | 'scanned'
  | 'expired'
  | 'error';

interface ActiveQR {
  token:        string;
  qrDataUrl:    string;
  safetyExpiry: string;
  amountRupees: number | null;
}

const POLL_INTERVAL_MS = 2000;
const MAX_DIALS = 6;

export default function QRPanel({ slug, campaignType, speedDials: initialDials }: QRPanelProps) {
  const [state,       setState]       = useState<PanelState>(
    campaignType === 'visit_based' ? 'generating' : 'idle',
  );
  const [activeQR,    setActiveQR]    = useState<ActiveQR | null>(null);
  const [customAmt,   setCustomAmt]   = useState('');
  const [errorMsg,    setErrorMsg]    = useState('');

  // ── Speed-dial editing ────────────────────────────────────────────────
  const [dials,       setDials]       = useState<number[]>(initialDials);
  const [editMode,    setEditMode]    = useState(false);
  const [editValues,  setEditValues]  = useState<string[]>([]);
  const [saveStatus,  setSaveStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (campaignType === 'visit_based') generateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

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
            setTimeout(() => { if (mountedRef.current) generateQR(); }, 1500);
          } else {
            setTimeout(() => { if (mountedRef.current) { setActiveQR(null); setState('idle'); } }, 2000);
          }
        } else if (data.status === 'expired' || data.status === 'revoked') {
          stopPolling();
          if (!mountedRef.current) return;
          setState('expired');
          setActiveQR(null);
        }
      } catch { /* silent */ }
    }, POLL_INTERVAL_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, campaignType]);

  async function generateQR(amountRupees?: number) {
    stopPolling();
    setState('generating');
    setErrorMsg('');
    setActiveQR(null);
    try {
      const body: Record<string, unknown> = {};
      if (campaignType === 'spend_based' && amountRupees) body.amount_rupees = amountRupees;
      const res  = await fetch(`/api/merchant/${slug}/qr/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!mountedRef.current) return;
      const data = await res.json();
      if (!res.ok) { setState('error'); setErrorMsg(data.error || "Couldn't generate QR — try again."); return; }
      const qr: ActiveQR = { token: data.token, qrDataUrl: data.qr_data_url, safetyExpiry: data.safety_expiry, amountRupees: data.amount_rupees ?? null };
      setActiveQR(qr);
      setState('ready');
      startPolling(qr.token);
    } catch {
      if (!mountedRef.current) return;
      setState('error');
      setErrorMsg("Couldn't generate QR — check your connection and try again.");
    }
  }

  async function revokeQR() {
    if (!activeQR) return;
    stopPolling();
    await fetch(`/api/merchant/${slug}/qr/${activeQR.token}`, { method: 'DELETE' }).catch(() => {});
    setActiveQR(null);
    if (campaignType === 'visit_based') generateQR(); else setState('idle');
  }

  // ── Speed-dial edit helpers ───────────────────────────────────────────
  function startEdit() {
    setEditValues(dials.map(String));
    setEditMode(true);
    setSaveStatus('idle');
  }

  function cancelEdit() {
    setEditMode(false);
    setSaveStatus('idle');
  }

  function updateEditValue(i: number, val: string) {
    setEditValues(prev => { const n = [...prev]; n[i] = val; return n; });
  }

  function removeDial(i: number) {
    setEditValues(prev => prev.filter((_, idx) => idx !== i));
  }

  function addDial() {
    if (editValues.length < MAX_DIALS) setEditValues(prev => [...prev, '']);
  }

  async function saveDials() {
    const parsed = editValues
      .map(v => parseInt(v, 10))
      .filter(v => !isNaN(v) && v > 0);

    if (parsed.length === 0) return;

    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/merchant/${slug}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed_dials: parsed }),
      });
      if (!res.ok) throw new Error('save failed');
      setDials(parsed);
      setSaveStatus('saved');
      setTimeout(() => { setEditMode(false); setSaveStatus('idle'); }, 800);
    } catch {
      setSaveStatus('error');
    }
  }

  // ── Scanned flash ─────────────────────────────────────────────────────
  if (state === 'scanned') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <span className="text-4xl">✓</span>
        </div>
        <p className="text-xl font-bold text-green-700">Scanned!</p>
        {campaignType === 'visit_based' && <p className="text-sm text-text-medium">Generating next QR…</p>}
      </div>
    );
  }

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

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <X size={24} className="text-status-error" />
        </div>
        <p className="text-status-error font-semibold">{errorMsg}</p>
        <Button onClick={() => generateQR()} variant="secondary" size="sm"><RefreshCw size={14} /> Try Again</Button>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">
          <QrCode size={24} className="text-yellow-600" />
        </div>
        <p className="font-semibold text-text-dark">QR expired</p>
        <p className="text-sm text-text-medium">This QR was not scanned in time.</p>
        <Button onClick={() => campaignType === 'visit_based' ? generateQR() : setState('idle')} size="sm">
          <RefreshCw size={14} /> Generate New QR
        </Button>
      </div>
    );
  }

  if (state === 'ready' && activeQR) {
    return (
      <div className="flex flex-col items-center gap-5">
        {activeQR.amountRupees && (
          <div className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-full text-lg font-bold shadow-btn">
            <IndianRupee size={18} />
            {activeQR.amountRupees.toLocaleString('en-IN')}
          </div>
        )}
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border-light bg-white p-3">
          <Image src={activeQR.qrDataUrl} alt="Scan QR code" width={280} height={280} priority unoptimized />
        </div>
        <div className="flex items-center gap-2 text-sm text-text-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          {campaignType === 'visit_based' ? 'Ready — show to customer to scan' : 'Waiting for customer to scan…'}
        </div>
        <button onClick={revokeQR} className="flex items-center gap-1.5 text-sm text-text-light hover:text-status-error transition-colors">
          <X size={14} />
          {campaignType === 'visit_based' ? 'Cancel & regenerate' : 'Cancel QR'}
        </button>
      </div>
    );
  }

  // ── Idle: amount selector (spend-based) ───────────────────────────────
  return (
    <div className="space-y-6">

      {/* Quick amounts header + edit toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-dark">Quick amounts</p>
          {!editMode ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 transition-colors font-medium"
            >
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEdit}
                className="text-xs text-text-light hover:text-text-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDials}
                disabled={saveStatus === 'saving'}
                className={clsx(
                  'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors',
                  saveStatus === 'saving' && 'bg-primary/50 text-white cursor-not-allowed',
                  saveStatus === 'saved'  && 'bg-green-500 text-white',
                  saveStatus === 'error'  && 'bg-red-500 text-white',
                  saveStatus === 'idle'   && 'bg-primary text-white hover:bg-primary/90',
                )}
              >
                {saveStatus === 'saving' && <RefreshCw size={11} className="animate-spin" />}
                {saveStatus === 'saved'  && <Check size={11} />}
                {saveStatus === 'error'  && 'Error'}
                {saveStatus === 'idle'   && 'Save'}
                {saveStatus === 'saving' && 'Saving…'}
                {saveStatus === 'saved'  && 'Saved!'}
              </button>
            </div>
          )}
        </div>

        {/* Normal dial buttons */}
        {!editMode && (
          <div className="grid grid-cols-2 gap-3">
            {dials.map((amount) => (
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
        )}

        {/* Edit mode: inputs */}
        {editMode && (
          <div className="space-y-2">
            {editValues.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                  <input
                    type="number"
                    value={val}
                    min={1}
                    step={1}
                    placeholder="Amount"
                    onChange={(e) => updateEditValue(i, e.target.value)}
                    className="form-input pl-8 py-2 text-sm"
                    autoFocus={i === editValues.length - 1}
                  />
                </div>
                <button
                  onClick={() => removeDial(i)}
                  disabled={editValues.length <= 1}
                  className="p-2 rounded-lg text-text-light hover:text-status-error hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {editValues.length < MAX_DIALS && (
              <button
                onClick={addDial}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-border-light text-text-light hover:border-primary hover:text-primary transition-colors text-sm"
              >
                <Plus size={14} /> Add amount
              </button>
            )}

            {saveStatus === 'error' && (
              <p className="text-xs text-status-error text-center mt-1">Could not save — try again.</p>
            )}
          </div>
        )}
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
              onKeyDown={(e) => { if (e.key === 'Enter' && customAmt && Number(customAmt) > 0) generateQR(Number(customAmt)); }}
            />
          </div>
          <Button
            onClick={() => { const amt = Number(customAmt); if (amt > 0) generateQR(amt); }}
            disabled={!customAmt || Number(customAmt) <= 0}
            size="md"
          >
            Generate
          </Button>
        </div>
      </div>

      {errorMsg && <p className="text-sm text-status-error text-center">{errorMsg}</p>}
    </div>
  );
}
