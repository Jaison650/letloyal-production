'use client';

import { useEffect, useState } from 'react';
import { Users, ShoppingBag, BarChart2, Gift } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  total_merchants:   number;
  total_customers:   number;
  total_visits:      number;
  total_redemptions: number;
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-teal-subtle flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-ink">{value}</p>
        <p className="text-sm text-ink-sub">{label}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => d.ok && setStats(d.stats))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-ink-sub text-sm">Loading…</p>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Merchants" value={stats.total_merchants}   icon={<ShoppingBag size={22} className="text-teal" />} />
          <StatCard label="Total Customers"  value={stats.total_customers}   icon={<Users       size={22} className="text-teal" />} />
          <StatCard label="Total Visits"     value={stats.total_visits}      icon={<BarChart2   size={22} className="text-teal" />} />
          <StatCard label="Redemptions"      value={stats.total_redemptions} icon={<Gift        size={22} className="text-teal" />} />
        </div>
      ) : (
        <p className="text-bad text-sm">Failed to load stats.</p>
      )}

      <div className="card max-w-sm">
        <h2 className="font-bold text-ink mb-2">Quick Actions</h2>
        <Link
          href="/admin/merchants"
          className="inline-flex items-center gap-2 rounded-full bg-teal text-teal-fg font-bold text-sm px-5 py-2.5 hover:bg-teal-hover transition-colors"
        >
          <Users size={16} /> Manage Merchants
        </Link>
      </div>
    </div>
  );
}
