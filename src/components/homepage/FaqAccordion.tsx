'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const FAQS = [
  { q: 'Do my customers need to download an app?', a: 'No. Customers scan your QR code with their phone camera and register in under 60 seconds. No app store, no download, no friction.' },
  { q: 'Does LetLoyal work with my existing POS system?', a: 'Yes — LetLoyal works independently of your POS. For visit-based programs, customers just scan the static QR. For spend-based, you tap the purchase amount on the merchant dashboard.' },
  { q: 'What equipment do I need?', a: 'Nothing special. Print your QR code on paper, frame it, or show it on a screen or tablet. That\'s it.' },
  { q: 'How does QR scanning work?', a: 'When a customer scans your QR code with their phone camera, they\'re taken to your store page on LetLoyal. After signing in (or registering), points are credited automatically.' },
  { q: 'Can I run both visit-based and spend-based campaigns?', a: 'Yes, merchants can run multiple campaigns simultaneously — including different types.' },
  { q: 'What happens to my customers\' points if I leave?', a: 'Customer accounts and points are always accessible. In the event of cancellation, customers retain read access to their point history for 90 days.' },
  { q: 'Is LetLoyal GDPR compliant?', a: 'Yes. We collect only the minimum necessary data, provide clear consent flows, and never sell customer data to third parties.' },
  { q: 'How do customers redeem their rewards?', a: 'When a customer reaches their reward threshold, they tap "Redeem Now" in their loyalty dashboard. A 6-digit OTP appears. The merchant validates it on their dashboard.' },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div key={i} className="bg-surface-1 rounded-[16px] border border-stroke shadow-ds overflow-hidden">
          <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-surface-2 transition-colors">
            <span className="font-semibold text-ink pr-4">{faq.q}</span>
            <motion.div animate={{ rotate: open === i ? 90 : 0 }} transition={{ duration: 0.2 }} className={`shrink-0 ${open === i ? 'text-teal' : 'text-ink-faint'}`}>
              <ChevronRight size={18} />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden">
                <div className="px-6 pb-5 pt-0 text-ink-sub text-sm leading-relaxed border-t border-stroke">
                  <div className="pt-4">{faq.a}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
