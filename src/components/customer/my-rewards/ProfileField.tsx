'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

// ── Inline editable field ─────────────────────────────────────────────────────
export default function ProfileField({
  label, value, icon, onSave, type = 'text', options,
}: {
  label: string; value: string | null; icon: ReactNode;
  onSave: (val: string) => Promise<void>; type?: string;
  options?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    setSaving(true); setErr('');
    try { await onSave(input); setEditing(false); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="px-4 py-3 border-b border-stroke last:border-0">
      {!editing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-ink-faint flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <p className="text-xs text-ink-faint">{label}</p>
              <p data-clarity-mask="true" className={`text-sm font-medium truncate ${value ? 'text-ink' : 'text-ink-faint italic'}`}>{value || 'Not set'}</p>
            </div>
          </div>
          <button onClick={() => { setInput(value ?? ''); setEditing(true); }}
            className="text-xs text-teal font-semibold flex-shrink-0 ml-2">{value ? 'Edit' : 'Add'}</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-ink">{label}</p>
          {options ? (
            <select value={input} onChange={e => setInput(e.target.value)}
              className="w-full rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 text-[16px] md:text-body text-ink px-3.5 py-2.5 focus:outline-none focus:border-teal focus:shadow-ring">
              <option value="">Prefer not to say</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={type} value={input} onChange={e => setInput(e.target.value)}
              className="w-full rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 text-[16px] md:text-body text-ink placeholder:text-ink-faint px-3.5 py-2.5 focus:outline-none focus:border-teal focus:shadow-ring" />
          )}
          {err && <p className="text-xs text-bad">{err}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-teal text-teal-fg text-xs font-semibold py-2 rounded-full disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setErr(''); }}
              className="flex-1 border border-stroke-strong text-xs font-semibold py-2 rounded-full text-ink-sub">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
