'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { RefreshCw, X, QrCode, IndianRupee, Pencil, Plus, Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import { MENU_EMOJI_PRESETS, type NamedDial } from '@/lib/constants';

interface QRPanelProps {
  slug:          string;
  campaignType:  'visit_based' | 'spend_based';
  speedDials:    NamedDial[];
}

type PanelState =
  | 'idle'
  | 'managing'
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
  itemName:     string | null;
  quantity:     number;
}

const POLL_INTERVAL_MS = 2000;
const MAX_DIALS = 6;

const TILE_PALETTE = [
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#FFF7ED', text: '#9A3412' },
  { bg: '#FFF1F2', text: '#9F1239' },
  { bg: '#EDE9FE', text: '#5B21B6' },
  { bg: '#E0F2FE', text: '#0C4A6E' },
  { bg: '#ECFDF5', text: '#064E3B' },
];

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function QRPanel({ slug, campaignType, speedDials: initialDials }: QRPanelProps) {
  const autoGen = campaignType === 'visit_based' && initialDials.length === 0;

  const [state,       setState]       = useState<PanelState>(autoGen ? 'generating' : 'idle');
  const [activeQR,    setActiveQR]    = useState<ActiveQR | null>(null);
  const [customAmt,   setCustomAmt]   = useState('');
  const [errorMsg,    setErrorMsg]    = useState('');
  const [dials,       setDials]       = useState<NamedDial[]>(initialDials);

  // Per-tile cart counts (spend_based only)
  const [dialCounts,  setDialCounts]  = useState<number[]>(() => initialDials.map(() => 0));

  // ── Managing state ─────────────────────────────────────────────────────
  const [editDials,  setEditDials]  = useState<NamedDial[]>([]);
  const [editIdx,    setEditIdx]    = useState<number | 'new' | null>(null);
  const [formName,   setFormName]   = useState('');
  const [formPrice,  setFormPrice]  = useState('');
  const [formEmoji,  setFormEmoji]  = useState('');
  const [emojiOpen,  setEmojiOpen]  = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
    if (autoGen) generateQR();
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
          if (campaignType === 'visit_based' && dials.length === 0) {
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
  }, [slug, campaignType, dials.length]);

  async function generateQR(amountRupees?: number, itemName?: string, qty?: number) {
    stopPolling();
    setState('generating');
    setErrorMsg('');
    setActiveQR(null);
    try {
      const body: Record<string, unknown> = {};
      if (campaignType === 'spend_based' && amountRupees) body.amount_rupees = amountRupees;
      if (itemName) body.item_name = itemName;
      if (qty && qty > 1) body.quantity = qty;
      const res  = await fetch(`/api/merchant/${slug}/qr/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!mountedRef.current) return;
      const data = await res.json();
      if (!res.ok) { setState('error'); setErrorMsg(data.error || "Couldn't generate QR — try again."); return; }
      const qr: ActiveQR = {
        token:        data.token,
        qrDataUrl:    data.qr_data_url,
        safetyExpiry: data.safety_expiry,
        amountRupees: data.amount_rupees ?? null,
        itemName:     data.item_name ?? null,
        quantity:     data.quantity ?? 1,
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

  async function revokeQR() {
    if (!activeQR) return;
    stopPolling();
    await fetch(`/api/merchant/${slug}/qr/${activeQR.token}`, { method: 'DELETE' }).catch(() => {});
    setActiveQR(null);
    if (campaignType === 'visit_based' && dials.length === 0) generateQR(); else setState('idle');
  }

  // ── Tile cart helpers (spend_based) ───────────────────────────────────
  function tileAdd(i: number) {
    setDialCounts(prev => { const n = [...prev]; n[i] = (n[i] || 0) + 1; return n; });
  }
  function tileDec(i: number) {
    setDialCounts(prev => { const n = [...prev]; n[i] = Math.max(0, (n[i] || 0) - 1); return n; });
  }
  function clearCart() {
    setDialCounts(dials.map(() => 0));
  }
  function cartTotal() {
    return dials.reduce((sum, d, i) => sum + d.price * (dialCounts[i] || 0), 0);
  }
  function cartQty() {
    return dialCounts.reduce((a, b) => a + b, 0);
  }
  function cartItemName() {
    const active = dials.filter((_, i) => dialCounts[i] > 0);
    return active.length === 1 ? active[0].name || undefined : undefined;
  }
  function cartSingleQty() {
    if (cartQty() === 0) return undefined;
    const activeIdx = dialCounts.findIndex(c => c > 0);
    const isOnly = dialCounts.filter(c => c > 0).length === 1;
    return isOnly ? dialCounts[activeIdx] : undefined;
  }

  // ── Managing helpers ───────────────────────────────────────────────────
  function enterManaging() {
    setEditDials([...dials]);
    setEditIdx(null);
    setSaveStatus('idle');
    setEmojiOpen(false);
    setState('managing');
  }

  function cancelEditItem() {
    setEditIdx(null);
    setEmojiOpen(false);
  }

  function startEditItem(i: number) {
    const item = editDials[i];
    setFormName(item.name);
    setFormPrice(String(item.price));
    setFormEmoji(item.emoji);
    setEditIdx(i);
    setEmojiOpen(false);
  }

  function startAddItem() {
    setFormName('');
    setFormPrice('');
    setFormEmoji('');
    setEditIdx('new');
    setEmojiOpen(false);
  }

  function confirmEditItem() {
    const price = parseFloat(formPrice);
    if (!formName.trim() || isNaN(price) || price <= 0) return;
    const item: NamedDial = { name: formName.trim().slice(0, 40), price, emoji: formEmoji };
    if (editIdx === 'new') {
      setEditDials(prev => [...prev, item]);
    } else if (typeof editIdx === 'number') {
      setEditDials(prev => { const n = [...prev]; n[editIdx] = item; return n; });
    }
    setEditIdx(null);
    setEmojiOpen(false);
  }

  function removeItem(i: number) {
    setEditDials(prev => prev.filter((_, idx) => idx !== i));
    if (editIdx === i) { setEditIdx(null); setEmojiOpen(false); }
  }

  function moveItem(i: number, dir: -1 | 1) {
    setEditDials(prev => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const n = [...prev];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
    if (editIdx === i) setEditIdx(i + dir);
    else if (editIdx === i + dir) setEditIdx(i);
  }

  async function saveManaged() {
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/merchant/${slug}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speed_dials: editDials }),
      });
      if (!res.ok) throw new Error('save failed');
      setDials(editDials);
      setDialCounts(editDials.map(() => 0));
      setSaveStatus('saved');
      setTimeout(() => { setState('idle'); setSaveStatus('idle'); setEditIdx(null); }, 700);
    } catch {
      setSaveStatus('error');
    }
  }

  // ── Edit form (used in both editing existing and adding new) ──────────
  function EditForm({ forNew }: { forNew: boolean }) {
    return (
      <div className={clsx('px-3 py-3 space-y-2 bg-bg-muted', forNew ? 'rounded-xl border-2 border-primary' : 'border-t border-border-light')}>
        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setEmojiOpen(o => !o)}
              className="w-11 h-11 rounded-xl border-2 border-border-light text-xl flex items-center justify-center hover:border-primary transition-colors bg-white flex-shrink-0"
            >
              {formEmoji || '✚'}
            </button>
            {emojiOpen && (
              <div className="absolute top-12 left-0 z-30 bg-white border border-border-light rounded-2xl shadow-lg p-2 grid grid-cols-8 gap-0.5 w-64 max-h-36 overflow-y-auto">
                {MENU_EMOJI_PRESETS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setFormEmoji(e); setEmojiOpen(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-muted text-base"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="Item name"
            maxLength={40}
            className="form-input flex-1 py-2 text-sm"
            autoFocus
          />
        </div>
        <div className="relative">
          <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type="number"
            value={formPrice}
            onChange={e => setFormPrice(e.target.value)}
            placeholder="Price"
            min={0.01}
            step={0.01}
            className="form-input pl-8 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={cancelEditItem}
            className="flex-1 py-2 text-sm text-text-medium border border-border-light rounded-xl hover:bg-border-light transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmEditItem}
            disabled={!formName.trim() || !formPrice || Number(formPrice) <= 0}
            className="flex-1 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
          >
            <Check size={13} />
            {forNew ? 'Add Item' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // STATE RENDERS
  // ─────────────────────────────────────────────────────────────────────

  if (state === 'scanned') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <span className="text-4xl">✓</span>
        </div>
        <p className="text-xl font-bold text-green-700">Scanned!</p>
        {campaignType === 'visit_based' && dials.length === 0 && <p className="text-sm text-text-medium">Generating next QR…</p>}
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
        <Button
          onClick={() => campaignType === 'visit_based' && dials.length === 0 ? generateQR() : setState('idle')}
          size="sm"
        >
          <RefreshCw size={14} /> Generate New QR
        </Button>
      </div>
    );
  }

  if (state === 'ready' && activeQR) {
    return (
      <div className="flex flex-col items-center gap-5">
        {(activeQR.amountRupees || activeQR.itemName) && (
          <div className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white rounded-full text-lg font-bold shadow-btn">
            {activeQR.itemName && (
              <span>{activeQR.itemName}{activeQR.quantity > 1 ? ` ×${activeQR.quantity}` : ''}</span>
            )}
            {activeQR.amountRupees != null && (
              <span className="flex items-center gap-1">
                {activeQR.itemName && <span className="opacity-60">·</span>}
                <IndianRupee size={18} />
                {activeQR.amountRupees.toLocaleString('en-IN')}
              </span>
            )}
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

  // ── Managing state ─────────────────────────────────────────────────────
  if (state === 'managing') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border-light">
          <button
            onClick={() => { setEditIdx(null); setEmojiOpen(false); setState('idle'); }}
            className="text-sm text-text-medium hover:text-text-dark transition-colors"
          >
            Back
          </button>
          <p className="font-bold text-text-dark">Menu Items</p>
          <button
            onClick={saveManaged}
            disabled={saveStatus === 'saving'}
            className={clsx(
              'text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors',
              saveStatus === 'saving' && 'bg-primary/50 text-white cursor-not-allowed',
              saveStatus === 'saved'  && 'bg-green-500 text-white',
              saveStatus === 'error'  && 'bg-red-500 text-white',
              saveStatus === 'idle'   && 'bg-primary text-white hover:bg-primary/90',
            )}
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>

        <div className="space-y-2">
          {editDials.map((dial, i) => {
            const isEditing = editIdx === i;
            const palette = TILE_PALETTE[i % TILE_PALETTE.length];
            return (
              <div key={i} className="rounded-xl border border-border-light overflow-visible">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: palette.bg }}
                  >
                    {dial.emoji || '🛒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-dark truncate">{dial.name || '—'}</p>
                    <p className="text-xs text-text-medium">{formatINR(dial.price)}</p>
                  </div>
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveItem(i, -1)}
                      disabled={i === 0}
                      className="p-0.5 rounded text-text-light hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      onClick={() => moveItem(i, 1)}
                      disabled={i === editDials.length - 1}
                      className="p-0.5 rounded text-text-light hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => isEditing ? cancelEditItem() : startEditItem(i)}
                      className="p-1.5 rounded-lg text-text-light hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1.5 rounded-lg text-text-light hover:text-status-error hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isEditing && <EditForm forNew={false} />}
              </div>
            );
          })}
        </div>

        {editDials.length < MAX_DIALS && editIdx !== 'new' && (
          <button
            onClick={startAddItem}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border-light text-text-light hover:border-primary hover:text-primary transition-colors text-sm font-medium"
          >
            <Plus size={14} /> Add item
          </button>
        )}

        {editIdx === 'new' && <EditForm forNew={true} />}

        {saveStatus === 'error' && (
          <p className="text-xs text-status-error text-center">Could not save — try again.</p>
        )}
      </div>
    );
  }

  // ── Idle state ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Named tile grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-text-dark">Menu Items</p>
          {dials.length > 0 && (
            <button
              onClick={enterManaging}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/70 transition-colors font-medium"
            >
              <Pencil size={12} /> Manage
            </button>
          )}
        </div>

        {dials.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {dials.map((dial, i) => {
                const palette = TILE_PALETTE[i % TILE_PALETTE.length];
                const count   = dialCounts[i] || 0;
                if (campaignType === 'visit_based') {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => generateQR(undefined, dial.name || undefined, 1)}
                      className="rounded-xl p-3 text-left active:scale-95 transition-transform"
                      style={{ background: palette.bg }}
                    >
                      {dial.emoji && <div className="text-2xl mb-1.5">{dial.emoji}</div>}
                      <p className={clsx('font-semibold leading-tight', dial.emoji ? 'text-sm' : 'text-base')} style={{ color: palette.text }}>
                        {dial.name || formatINR(dial.price)}
                      </p>
                      {dial.name && <p className="text-xs font-bold mt-0.5" style={{ color: palette.text }}>{formatINR(dial.price)}</p>}
                    </button>
                  );
                }
                return (
                  <div key={i} className="relative rounded-xl overflow-hidden" style={{ background: palette.bg }}>
                    {count > 0 && (
                      <button
                        type="button"
                        onClick={() => tileDec(i)}
                        className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-sm font-bold leading-none z-10"
                        style={{ color: palette.text }}
                      >
                        −
                      </button>
                    )}
                    {count > 0 && (
                      <div className="absolute top-2 right-2 min-w-[1.25rem] h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center px-1 z-10">
                        ×{count}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => tileAdd(i)}
                      className="w-full p-3 text-left active:scale-95 transition-transform"
                    >
                      {dial.emoji && <div className="text-2xl mb-1.5">{dial.emoji}</div>}
                      <p className={clsx('font-semibold leading-tight', dial.emoji ? 'text-sm' : 'text-base')} style={{ color: palette.text }}>
                        {dial.name || formatINR(dial.price)}
                      </p>
                      {dial.name && <p className="text-xs font-bold mt-0.5" style={{ color: palette.text }}>{formatINR(dial.price)}</p>}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sticky cart bar */}
            {campaignType === 'spend_based' && cartQty() > 0 && (
              <button
                onClick={() => { generateQR(cartTotal(), cartItemName(), cartSingleQty()); clearCart(); }}
                className="w-full flex items-center justify-between py-4 px-5 rounded-2xl bg-primary text-white font-bold shadow-btn active:scale-95 transition-transform mt-3"
              >
                <span className="flex items-center gap-2 text-sm">
                  <QrCode size={16} />
                  Generate · {cartQty()} item{cartQty() === 1 ? '' : 's'}
                </span>
                <span className="text-lg">{formatINR(cartTotal())}</span>
              </button>
            )}
          </>
        ) : (
          <button
            onClick={enterManaging}
            className="w-full flex flex-col items-center gap-2 py-8 rounded-xl border-2 border-dashed border-border-light hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Plus size={20} className="text-text-light" />
            <p className="text-sm text-text-medium">No menu items yet</p>
            <p className="text-xs font-semibold text-primary">Add item</p>
          </button>
        )}
      </div>

      {/* Generic visit QR (visit-based with named dials) */}
      {campaignType === 'visit_based' && dials.length > 0 && (
        <button
          onClick={() => generateQR()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-border-light text-sm font-medium text-text-medium hover:border-primary hover:text-primary transition-all"
        >
          <QrCode size={14} /> Generic visit QR
        </button>
      )}

      {/* Custom amount (spend-based only) */}
      {campaignType === 'spend_based' && (
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
      )}

      {errorMsg && <p className="text-sm text-status-error text-center">{errorMsg}</p>}
    </div>
  );
}
