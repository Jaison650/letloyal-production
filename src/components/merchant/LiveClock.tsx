'use client';

import { useEffect, useState } from 'react';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function LiveClock({ businessName }: { businessName: string }) {
  const [time, setTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    function tick() {
      const now = new Date();
      setTime(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">
          {greeting()}, {businessName}
        </h1>
        <p className="text-sm text-text-light mt-0.5">{today}</p>
      </div>
      {mounted && (
        <div className="text-3xl font-mono font-bold text-primary tabular-nums">
          {time}
        </div>
      )}
    </div>
  );
}
