'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Upload, X, Plus, Trash2, Globe, Instagram, MapPin, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import type { SpeedDial } from '@/lib/constants';
import { SPEED_DIAL_ICON_MAP, getSpeedDialIcon } from '@/lib/speedDialIcons';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

interface ProfileData {
  business_name:     string;
  logo_url:          string | null;
  banner_url:        string | null;
  address:           string | null;
  gmaps_url:         string | null;
  instagram_url:     string | null;
  google_review_url: string | null;
  latitude:          number | null;
  longitude:         number | null;
  speed_dials:       SpeedDial[];
}

interface ProfileEditorProps {
  slug:        string;
  initialData: ProfileData;
}

type Tab = 'branding' | 'contact' | 'location' | 'speed_dials';

// ── Image upload widget ───────────────────────────────────────────────────────
function ImageUpload({
  label,
  value,
  onChange,
  folder,
  aspectRatio,
  hint,
}: {
  label:       string;
  value:       string | null;
  onChange:    (url: string | null) => void;
  folder:      string;
  aspectRatio: string;
  hint?:       string;
}) {
  const inputRef    = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file',   file);
      fd.append('folder', folder);

      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed.');
        return;
      }
      onChange(data.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-border-light bg-bg-muted">
          <div className={clsx('relative w-full', aspectRatio)}>
            <Image src={value} alt={label} fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm text-status-error opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={clsx(
            'w-full rounded-xl border-2 border-dashed border-border-light flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer',
            aspectRatio,
            uploading
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:border-primary hover:bg-primary-light/30',
          )}
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-text-light">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-text-light" />
              <span className="text-xs text-text-light">Click to upload</span>
              <span className="text-xs text-text-light opacity-60">PNG, JPG, WebP</span>
              {hint && <span className="text-xs text-text-light opacity-60">{hint}</span>}
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-status-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── Main ProfileEditor ────────────────────────────────────────────────────────
export default function ProfileEditor({ slug, initialData }: ProfileEditorProps) {
  const [tab,     setTab]     = useState<Tab>('branding');
  const [form,    setForm]    = useState<ProfileData>(initialData);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [iconPickerFor, setIconPickerFor] = useState<number | null>(null);

  // Re-sync if initialData changes (e.g. page re-fetch)
  useEffect(() => { setForm(initialData); }, [initialData]);

  function setField<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function moveSpeedDial(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= form.speed_dials.length) return;
    const updated = [...form.speed_dials];
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setField('speed_dials', updated);
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed.'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'branding',    label: 'Branding'         },
    { id: 'contact',     label: 'Contact & Social'  },
    { id: 'location',    label: 'Location'          },
    { id: 'speed_dials', label: 'Speed Dials'       },
  ];

  return (
    <div className="max-w-xl space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-bg-muted rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white shadow-sm text-text-dark'
                : 'text-text-medium hover:text-text-dark',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Branding tab ─────────────────────────────────────────── */}
      {tab === 'branding' && (
        <div className="space-y-5">
          <Input
            label="Business Name"
            value={form.business_name}
            onChange={(e) => setField('business_name', e.target.value)}
            placeholder="Your business name"
            maxLength={120}
          />

          <ImageUpload
            label="Logo"
            value={form.logo_url}
            onChange={(url) => setField('logo_url', url)}
            folder="logos"
            aspectRatio="h-24"
            hint="Recommended: 400 × 400px (square)"
          />

          <ImageUpload
            label="Banner Image"
            value={form.banner_url}
            onChange={(url) => setField('banner_url', url)}
            folder="banners"
            aspectRatio="h-36"
            hint="Recommended: 1200 × 400px (3:1 wide)"
          />
        </div>
      )}

      {/* ── Contact & Social tab ──────────────────────────────────── */}
      {tab === 'contact' && (
        <div className="space-y-4">
          <Input
            label="Address"
            value={form.address ?? ''}
            onChange={(e) => setField('address', e.target.value || null)}
            placeholder="123 Main St, City"
            icon={<MapPin size={16} />}
          />
          <Input
            label="Google Maps URL"
            value={form.gmaps_url ?? ''}
            onChange={(e) => setField('gmaps_url', e.target.value || null)}
            placeholder="https://maps.google.com/..."
            icon={<Globe size={16} />}
          />
          <Input
            label="Instagram URL"
            value={form.instagram_url ?? ''}
            onChange={(e) => setField('instagram_url', e.target.value || null)}
            placeholder="https://instagram.com/yourbusiness"
            icon={<Instagram size={16} />}
          />
          <Input
            label="Google Review URL"
            value={form.google_review_url ?? ''}
            onChange={(e) => setField('google_review_url', e.target.value || null)}
            placeholder="https://g.page/r/..."
            icon={<Star size={16} />}
          />
        </div>
      )}

      {/* ── Location tab ─────────────────────────────────────────── */}
      {tab === 'location' && (
        <div className="space-y-4">
          <p className="text-sm text-text-medium">
            Pin your store on the map so customers can discover you nearby.
          </p>
          {form.latitude && form.longitude && (
            <p className="text-xs text-primary font-medium">
              ✓ Location set ({form.latitude.toFixed(5)}, {form.longitude.toFixed(5)})
            </p>
          )}
          <LocationPicker
            initialLat={form.latitude}
            initialLng={form.longitude}
            onChange={(lat, lng) => {
              setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
              setSaved(false);
            }}
          />
          {form.latitude && form.longitude && (
            <button
              type="button"
              onClick={() => { setForm(prev => ({ ...prev, latitude: null, longitude: null })); setSaved(false); }}
              className="text-xs text-status-error hover:underline"
            >
              Remove location pin
            </button>
          )}
        </div>
      )}

      {/* ── Speed Dials tab ───────────────────────────────────────── */}
      {tab === 'speed_dials' && (
        <div className="space-y-4">
          <p className="text-sm text-text-medium">
            Set preset ₹ amounts shown on your QR screen. Give each one an optional label and icon
            (e.g. ☕ &quot;Coffee&quot;) so staff can recognize them at a glance. Add up to 6.
          </p>

          <div className="space-y-2">
            {form.speed_dials.map((dial, i) => {
              const DialIcon = getSpeedDialIcon(dial.icon);
              return (
                <div key={i} className="space-y-2 p-3 rounded-xl border border-border-light">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIconPickerFor(iconPickerFor === i ? null : i)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border-light hover:border-primary text-text-medium hover:text-primary transition-colors flex-shrink-0"
                        aria-label="Choose icon"
                      >
                        <DialIcon size={16} />
                      </button>
                      {iconPickerFor === i && (
                        <div className="absolute z-10 top-full left-0 mt-1 p-2 grid grid-cols-5 gap-1 bg-white rounded-xl border border-border-light shadow-lg">
                          {(Object.entries(SPEED_DIAL_ICON_MAP) as [string, typeof DialIcon][]).map(([key, Icon]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                const updated = [...form.speed_dials];
                                updated[i] = { ...updated[i], icon: key };
                                setField('speed_dials', updated);
                                setIconPickerFor(null);
                              }}
                              className={clsx(
                                'w-8 h-8 flex items-center justify-center rounded-lg transition-colors',
                                dial.icon === key ? 'bg-primary text-white' : 'text-text-medium hover:bg-bg-muted',
                              )}
                            >
                              <Icon size={15} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-text-medium text-sm">₹</span>
                    <input
                      type="number"
                      value={dial.amount}
                      min={1}
                      step={1}
                      onChange={(e) => {
                        const updated = [...form.speed_dials];
                        updated[i] = { ...updated[i], amount: Math.max(1, parseInt(e.target.value) || 1) };
                        setField('speed_dials', updated);
                      }}
                      className="form-input flex-1 w-0"
                    />
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveSpeedDial(i, -1)}
                        disabled={i === 0}
                        className="p-0.5 rounded text-text-light hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSpeedDial(i, 1)}
                        disabled={i === form.speed_dials.length - 1}
                        className="p-0.5 rounded text-text-light hover:text-primary disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move down"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setField('speed_dials', form.speed_dials.filter((_, j) => j !== i))}
                      className="p-2 rounded-lg hover:bg-red-50 text-text-light hover:text-status-error transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={dial.label ?? ''}
                    maxLength={24}
                    placeholder="Label (optional), e.g. Coffee"
                    onChange={(e) => {
                      const updated = [...form.speed_dials];
                      updated[i] = { ...updated[i], label: e.target.value || null };
                      setField('speed_dials', updated);
                    }}
                    className="form-input text-sm py-1.5 w-full"
                  />
                </div>
              );
            })}
          </div>

          {form.speed_dials.length < 6 && (
            <button
              type="button"
              onClick={() => setField('speed_dials', [...form.speed_dials, { amount: 100, label: null, icon: null }])}
              className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
            >
              <Plus size={16} /> Add amount
            </button>
          )}
        </div>
      )}

      {/* ── Save bar ──────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error">
          {error}
        </div>
      )}

      <Button
        onClick={handleSave}
        loading={saving}
        fullWidth
        variant={saved ? 'secondary' : 'primary'}
      >
        {saved ? '✓ Saved' : 'Save Changes'}
      </Button>
    </div>
  );
}
