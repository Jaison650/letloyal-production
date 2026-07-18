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
    <div className="px-4 py-3 border-b border-border-light last:border-0">
      {!editing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-text-light flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <p className="text-xs text-text-light">{label}</p>
              <p data-clarity-mask="true" className={`text-sm font-medium truncate ${value ? 'text-text-dark' : 'text-text-light italic'}`}>{value || 'Not set'}</p>
            </div>
          </div>
          <button onClick={() => { setInput(value ?? ''); setEditing(true); }}
            className="text-xs text-primary font-semibold flex-shrink-0 ml-2">{value ? 'Edit' : 'Add'}</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-dark">{label}</p>
          {options ? (
            <select value={input} onChange={e => setInput(e.target.value)} className="form-input text-sm">
              <option value="">Prefer not to say</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={type} value={input} onChange={e => setInput(e.target.value)}
              className="form-input text-sm" />
          )}
          {err && <p className="text-xs text-status-error">{err}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-primary text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setErr(''); }}
              className="flex-1 border border-border-light text-xs font-semibold py-2 rounded-lg text-text-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
