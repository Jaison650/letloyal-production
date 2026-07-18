'use client';

import { User, Mail, Calendar, Users, Lock, ChevronUp, ChevronDown, LogOut } from 'lucide-react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ds';
import ProfileField from './ProfileField';
import type { CustomerData, LoyaltyCard, Tab } from './types';

// ── Account tab ───────────────────────────────────────────────────────────────
export default function AccountTab({
  customer, cards, unlocked, saveField,
  pwSection, setPwSection, pwDone, curPw, setCurPw, newPw, setNewPw, confirmPw, setConfirmPw,
  pwError, pwSaving, handleChangePassword,
  setTab, handleLogout,
  analyticsEnabled, toggleAnalytics,
}: {
  customer: CustomerData;
  cards: LoyaltyCard[];
  unlocked: LoyaltyCard[];
  saveField: (field: string, value: string) => Promise<void>;
  pwSection: boolean;
  setPwSection: (v: boolean | ((prev: boolean) => boolean)) => void;
  pwDone: boolean;
  curPw: string;
  setCurPw: (v: string) => void;
  newPw: string;
  setNewPw: (v: string) => void;
  confirmPw: string;
  setConfirmPw: (v: string) => void;
  pwError: string;
  pwSaving: boolean;
  handleChangePassword: (e: FormEvent) => void;
  setTab: (t: Tab) => void;
  handleLogout: () => Promise<void>;
  analyticsEnabled: boolean;
  toggleAnalytics: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds overflow-hidden">
        {/* Avatar + name header */}
        <div className="flex items-center gap-3 p-4 border-b border-stroke">
          <div className="w-12 h-12 rounded-2xl bg-teal-subtle flex items-center justify-center flex-shrink-0">
            <span data-clarity-mask="true" className="text-xl font-bold text-teal">{(customer.name ?? 'C')[0].toUpperCase()}</span>
          </div>
          <div>
            <p data-clarity-mask="true" className="font-bold text-ink">{customer.name ?? 'Customer'}</p>
            <p data-clarity-mask="true" className="text-sm text-ink-faint">+91 {customer.phone}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 divide-x divide-stroke border-b border-stroke">
          <div className="p-3 text-center">
            <p className="text-xl font-bold text-ink">{cards.length}</p>
            <p className="text-xs text-ink-faint">Loyalty Cards</p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xl font-bold text-teal">{unlocked.length}</p>
            <p className="text-xs text-ink-faint">Rewards Ready</p>
          </div>
        </div>

        {/* Editable fields */}
        <ProfileField label="Full Name" value={customer.name} icon={<User size={15} />}
          onSave={v => saveField('name', v)} />
        <ProfileField label="Email Address" value={customer.email} icon={<Mail size={15} />}
          type="email" onSave={v => saveField('email', v)} />
        <ProfileField label="Birthday (optional)" value={customer.birthday ? new Date(customer.birthday).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null} icon={<Calendar size={15} />}
          type="date" onSave={v => saveField('birthday', v)} />
        <ProfileField label="Gender (optional)" value={customer.gender} icon={<Users size={15} />}
          options={[
            { value: 'male',              label: 'Male' },
            { value: 'female',            label: 'Female' },
            { value: 'other',             label: 'Other' },
            { value: 'prefer_not_to_say', label: 'Prefer not to say' },
          ]}
          onSave={v => saveField('gender', v)} />
      </div>

      {/* Change password */}
      <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds overflow-hidden">
        <button onClick={() => setPwSection(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Lock size={15} className="text-ink-faint" />
            <span className="text-sm font-semibold text-ink">Change Password</span>
          </div>
          {pwSection ? <ChevronUp size={16} className="text-ink-faint" /> : <ChevronDown size={16} className="text-ink-faint" />}
        </button>
        {pwSection && (
          <div className="px-4 pb-4 pt-0 border-t border-stroke">
            {pwDone ? (
              <p className="text-center text-sm font-semibold text-teal py-4">✓ Password updated!</p>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3 pt-3">
                <label className="block">
                  <span className="block text-body-sm font-semibold text-ink mb-1.5">Current Password</span>
                  <Input type="password" value={curPw}
                    onChange={e => setCurPw(e.target.value)} placeholder="••••••••" />
                </label>
                <label className="block">
                  <span className="block text-body-sm font-semibold text-ink mb-1.5">New Password</span>
                  <Input type="password" value={newPw}
                    onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" />
                </label>
                <label className="block">
                  <span className="block text-body-sm font-semibold text-ink mb-1.5">Confirm New Password</span>
                  <Input type="password" value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
                </label>
                {pwError && <p className="text-sm text-bad">{pwError}</p>}
                <button type="submit" disabled={pwSaving}
                  className="w-full bg-teal text-teal-fg font-semibold py-2.5 rounded-full disabled:opacity-50 transition-colors">
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <button onClick={() => setTab('cards')}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-stroke text-ink-sub font-medium text-sm hover:bg-surface-2 transition-colors">
        ← Back to My Cards
      </button>

      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-bad/30 text-bad font-semibold hover:bg-bad-subtle transition-colors">
        <LogOut size={18} /> Sign Out
      </button>

      {/* Data & Privacy section */}
      <div className="mt-4 pt-4 border-t border-stroke">
        <p className="text-xs font-semibold text-ink-sub uppercase tracking-wide mb-3">Data & Privacy</p>
        <div className="bg-surface-1 border border-stroke rounded-[11px] overflow-hidden">
          <a href="/privacy-policy" target="_blank"
            className="flex items-center justify-between px-4 py-3 border-b border-stroke hover:bg-surface-2 transition-colors">
            <span className="text-sm text-ink">Privacy Policy</span>
            <span className="text-xs text-ink-faint">→</span>
          </a>
          {/* DPDP 2023 — withdraw/grant optional analytics consent */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stroke">
            <div className="min-w-0 pr-3">
              <span className="text-sm text-ink">Usage analytics</span>
              <p className="text-xs text-ink-faint mt-0.5">Anonymous analytics to help improve the app. Optional.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={analyticsEnabled}
              onClick={toggleAnalytics}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${analyticsEnabled ? 'bg-teal' : 'bg-surface-2'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-1 transition-transform ${analyticsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to permanently delete your account and all your loyalty data? This cannot be undone.')) return;
              const res = await fetch('/api/customer/account', {
                method: 'DELETE',
                credentials: 'include',
              });
              if (res.ok) {
                await handleLogout();
                alert('Your account has been deleted.');
              } else {
                alert('Failed to delete account. Please contact hello@letloyal.com');
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-bad-subtle transition-colors text-left"
          >
            <span className="text-sm text-bad font-medium">Delete My Account & Data</span>
            <span className="text-xs text-bad/70">→</span>
          </button>
        </div>
        <p className="text-xs text-ink-faint mt-2 px-1">
          To request data correction or export, email{' '}
          <a href="mailto:hello@letloyal.com" className="text-teal">hello@letloyal.com</a>
        </p>
      </div>

      <p className="text-center text-xs text-ink-faint pb-2">Powered by LetLoyal</p>
    </div>
  );
}
