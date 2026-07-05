'use client';

import { useState } from 'react';

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-4 h-4 rounded-full border border-border-light bg-bg-muted text-text-light text-[10px] font-bold leading-none flex items-center justify-center hover:bg-primary-light hover:text-primary hover:border-primary transition-colors flex-shrink-0"
        aria-label="More information"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 w-60 rounded-xl bg-white border border-border-light shadow-lg px-3 py-2.5 text-xs text-text-medium leading-relaxed">
            {text}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-1.5 right-2 text-text-light hover:text-text-dark text-sm leading-none"
            >
              ×
            </button>
          </div>
        </>
      )}
    </span>
  );
}
