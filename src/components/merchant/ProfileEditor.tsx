'use client';

import { useState, useRef, useEffect } from 'react';
import { MERCHANT_ACCENTS } from '@/lib/merchantColor';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Button, Input } from '@/components/ds';
import { Upload, X, Plus, Trash2, Globe, Instagram, MapPin, Star, ArrowUp, ArrowDown } from 'lucide-react';
import { clsx } from 'clsx';
import { MENU_EMOJI_PRESETS, type NamedDial } from '@/lib/constants';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

interface ProfileData {
  business_name:     string;
  logo_url:          string | null;
  banner_url:        string | null;
  brand_color:       string | null;
  address:           string | null;
  gmaps_url:         string | null;
  instagram_url:     string | null;
  google_review_url: string | null;
  latitude:          number | null;
  longitude:         number | null;
  speed_dials:       NamedDial[];
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
      <label className="block text-body-sm font-semibold text-ink mb-1.5">{label}</label>

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-stroke bg-surface-2">
          <div className={clsx('relative w-full', aspectRatio)}>
            <Image src={value} alt={label} fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-surface-1/90 hover:bg-surface-1 rounded-full shadow-sm text-bad opacity-0 group-hover:opacity-100 transition-opacity"
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
            'w-full rounded-xl border-2 border-dashed border-stroke flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer',
            aspectRatio,
            uploading
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:border-teal hover:bg-teal-subtle/30',
          )}
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-teal" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs text-ink-faint">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-ink-faint" />
              <span className="text-xs text-ink-faint">Click to upload</span>
              <span className="text-xs text-ink-faint opacity-60">PNG, JPG, WebP</span>
              {hint && <span className="text-xs text-ink-faint opacity-60">{hint}</span>}
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-bad">{error}</p>}

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
  const [emojiPickerFor, setEmojiPickerFor] = useState<number | null>(null);

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
    { id: 'speed_dials', label: 'Menu Items'        },
  ];

  return (
    <div className="max-w-xl space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-surface-1 shadow-sm text-ink'
                : 'text-ink-sub hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Branding tab ─────────────────────────────────────────── */}
      {tab === 'branding' && (
        <div className="space-y-5">
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">Business Name</label>
            <Input
              value={form.business_name}
              onChange={(e) => setField('business_name', e.target.value)}
              placeholder="Your business name"
              maxLength={120}
            />
          </div>

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

          {/* ── Brand colour ─────────────────────────────────────────── */}
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">Brand Colour</label>
            <p className="text-caption text-ink-faint mb-3">
              Used on your store page and on your customers&apos; loyalty cards. Leave on Auto and we&apos;ll
              pick a colour for you.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setField('brand_color', null)}
                aria-pressed={!form.brand_color}
                title="Auto — chosen for you"
                className={`h-10 px-4 rounded-full text-body-sm font-bold border transition-colors ${
                  !form.brand_color
                    ? 'border-teal bg-teal-subtle text-teal'
                    : 'border-stroke-strong text-ink-sub hover:bg-surface-2'
                }`}
              >
                Auto
              </button>
              {MERCHANT_ACCENTS.map((hex) => {
                const active = form.brand_color?.toUpperCase() === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setField('brand_color', hex)}
                    aria-pressed={active}
                    aria-label={`Brand colour ${hex}`}
                    title={hex}
                    className="h-10 w-10 rounded-full transition-transform hover:scale-105"
                    style={{
                      background: `color-mix(in srgb, ${hex} 22%, transparent)`,
                      border: `2px solid ${active ? hex : 'transparent'}`,
                      boxShadow: active ? `0 0 0 3px color-mix(in srgb, ${hex} 25%, transparent)` : undefined,
                    }}
                  >
                    <span
                      aria-hidden
                      className="block mx-auto h-4 w-4 rounded-full"
                      style={{ background: hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Contact & Social tab ──────────────────────────────────── */}
      {tab === 'contact' && (
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">Address</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                <MapPin size={16} />
              </div>
              <Input
                value={form.address ?? ''}
                onChange={(e) => setField('address', e.target.value || null)}
                placeholder="123 Main St, City"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">Google Maps URL</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                <Globe size={16} />
              </div>
              <Input
                value={form.gmaps_url ?? ''}
                onChange={(e) => setField('gmaps_url', e.target.value || null)}
                placeholder="https://maps.google.com/..."
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">Instagram URL</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                <Instagram size={16} />
              </div>
              <Input
                value={form.instagram_url ?? ''}
                onChange={(e) => setField('instagram_url', e.target.value || null)}
                placeholder="https://instagram.com/yourbusiness"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">Google Review URL</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                <Star size={16} />
              </div>
              <Input
                value={form.google_review_url ?? ''}
                onChange={(e) => setField('google_review_url', e.target.value || null)}
                placeholder="https://g.page/r/..."
                className="pl-9"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Location tab ─────────────────────────────────────────── */}
      {tab === 'location' && (
        <div className="space-y-4">
          <p className="text-sm text-ink-sub">
            Pin your store on the map so customers can discover you nearby.
          </p>
          {form.latitude && form.longitude && (
            <p className="text-xs text-teal font-medium">
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
              className="text-xs text-bad hover:underline"
            >
              Remove location pin
            </button>
          )}
        </div>
      )}

      {/* ── Menu Items tab ────────────────────────────────────────── */}
      {tab === 'speed_dials' && (
        <div className="space-y-4">
          <p className="text-sm text-ink-sub">
            Set named menu items (name, price, and an emoji) shown as tiles on your QR screen.
            Customers see these too, so give each one a clear name — e.g. ☕ &quot;Cappuccino&quot; ₹150.
            Add up to 6.
          </p>

          <div className="space-y-2">
            {form.speed_dials.map((dial, i) => (
              <div key={i} className="space-y-2 p-3 rounded-xl border border-stroke">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEmojiPickerFor(emojiPickerFor === i ? null : i)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-stroke hover:border-teal text-lg transition-colors flex-shrink-0"
                      aria-label="Choose emoji"
                    >
                      {dial.emoji || '✚'}
                    </button>
                    {emojiPickerFor === i && (
                      <div className="absolute z-10 top-full left-0 mt-1 p-2 grid grid-cols-8 gap-0.5 bg-surface-1 rounded-xl border border-stroke shadow-lg w-64 max-h-36 overflow-y-auto">
                        {MENU_EMOJI_PRESETS.map(e => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => {
                              const updated = [...form.speed_dials];
                              updated[i] = { ...updated[i], emoji: e };
                              setField('speed_dials', updated);
                              setEmojiPickerFor(null);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-2 text-base"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    type="text"
                    value={dial.name}
                    maxLength={40}
                    placeholder="Item name, e.g. Cappuccino"
                    onChange={(e) => {
                      const updated = [...form.speed_dials];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setField('speed_dials', updated);
                    }}
                    className="flex-1 w-0 text-sm"
                  />
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => moveSpeedDial(i, -1)}
                      disabled={i === 0}
                      className="p-0.5 rounded text-ink-faint hover:text-teal disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSpeedDial(i, 1)}
                      disabled={i === form.speed_dials.length - 1}
                      className="p-0.5 rounded text-ink-faint hover:text-teal disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                      aria-label="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setField('speed_dials', form.speed_dials.filter((_, j) => j !== i))}
                    className="p-2 rounded-lg hover:bg-bad-subtle text-ink-faint hover:text-bad transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-sm">₹</span>
                  <Input
                    type="number"
                    value={dial.price}
                    min={1}
                    step={1}
                    onChange={(e) => {
                      const updated = [...form.speed_dials];
                      updated[i] = { ...updated[i], price: Math.max(1, parseFloat(e.target.value) || 1) };
                      setField('speed_dials', updated);
                    }}
                    className="text-sm py-1.5 w-full pl-7"
                  />
                </div>
              </div>
            ))}
          </div>

          {form.speed_dials.length < 6 && (
            <button
              type="button"
              onClick={() => setField('speed_dials', [...form.speed_dials, { name: '', price: 100, emoji: '' }])}
              className="flex items-center gap-2 text-sm text-teal font-medium hover:underline"
            >
              <Plus size={16} /> Add item
            </button>
          )}
        </div>
      )}

      {/* ── Save bar ──────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      <Button
        onClick={handleSave}
        loading={saving}
        fullWidth
        intent={saved ? 'secondary' : 'primary'}
      >
        {saved ? '✓ Saved' : 'Save Changes'}
      </Button>
    </div>
  );
}
