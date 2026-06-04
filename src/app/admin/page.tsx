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
      <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-text-dark">{value}</p>
        <p className="text-sm text-text-medium">{label}</p>
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
      <h1 className="text-2xl font-bold text-text-dark mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-text-medium text-sm">Loading…</p>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Merchants" value={stats.total_merchants}   icon={<ShoppingBag size={22} className="text-primary" />} />
          <StatCard label="Total Customers"  value={stats.total_customers}   icon={<Users       size={22} className="text-primary" />} />
          <StatCard label="Total Visits"     value={stats.total_visits}      icon={<BarChart2   size={22} className="text-primary" />} />
          <StatCard label="Redemptions"      value={stats.total_redemptions} icon={<Gift        size={22} className="text-primary" />} />
        </div>
      ) : (
        <p className="text-status-error text-sm">Failed to load stats.</p>
      )}

      <div className="card max-w-sm">
        <h2 className="font-bold text-text-dark mb-2">Quick Actions</h2>
        <Link
          href="/admin/merchants"
          className="btn-primary inline-flex items-center gap-2 text-sm px-5 py-2.5"
        >
          <Users size={16} /> Manage Merchants
        </Link>
      </div>
    </div>
  );
}
