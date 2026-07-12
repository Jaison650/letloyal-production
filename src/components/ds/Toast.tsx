'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';

type Intent = 'success' | 'error' | 'info' | 'reward';
type ToastItem = { id: number; title: string; description?: string; intent: Intent };

const ToastCtx = createContext<{ toast: (t: Omit<ToastItem, 'id'>) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const rootVariants = cva(
  'flex items-start gap-3 rounded-xl border bg-surface-1 p-4 shadow-ds data-[state=closed]:animate-out data-[state=closed]:fade-out',
  {
    variants: {
      intent: {
        success: 'border-l-[3px] border-l-good border-stroke',
        error: 'border-l-[3px] border-l-bad border-stroke',
        info: 'border-l-[3px] border-l-note border-stroke',
        reward: 'border-l-[3px] border-l-reward border-stroke',
      },
    },
  }
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    setItems((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4500}>
        {children}
        {items.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            className={cn(rootVariants({ intent: item.intent }))}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((i) => i.id !== item.id));
            }}
          >
            <div className="flex-1">
              <ToastPrimitive.Title className="text-body-sm font-bold text-ink">
                {item.title}
              </ToastPrimitive.Title>
              {item.description && (
                <ToastPrimitive.Description className="mt-0.5 text-caption text-ink-sub">
                  {item.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close aria-label="Dismiss" className="text-ink-faint hover:text-ink">
              ✕
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastCtx.Provider>
  );
}
