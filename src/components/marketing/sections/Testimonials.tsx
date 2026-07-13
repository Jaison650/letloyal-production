'use client';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, Badge } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const TESTIMONIALS = [
  { name: 'Rahul M.', role: 'Café Owner, Bengaluru', quote: 'I had my QR code live in 8 minutes. The first week, 12 customers signed up. My regulars now ask me about their points.' },
  { name: 'Priya L.', role: 'Salon Manager, Mumbai', quote: 'Paper stamp cards were a nightmare — customers lost them, started over constantly. LetLoyal solved all of that overnight.' },
  { name: 'Arjun P.', role: 'Gym Owner, Hyderabad', quote: 'The dashboard shows me exactly who is close to a reward. I can push them over the line with a personal message. Brilliant.' },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-4 bg-surface-1">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <div className="mb-6"><Badge intent="reward">India Pilot Merchants</Badge></div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-14">What merchants are saying</h2>
        </FadeUp>
        <motion.div variants={staggerContainer(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={fadeUp}>
              <Card padding="lg" className="text-left h-full">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#F2B824" stroke="#F2B824" />)}
                </div>
                <p className="text-ink leading-relaxed mb-5">
                  <span className="font-serif italic text-2xl text-reward-deep leading-none mr-0.5" aria-hidden>&#8220;</span>
                  {t.quote}
                  <span className="font-serif italic text-2xl text-reward-deep leading-none ml-0.5" aria-hidden>&#8221;</span>
                </p>
                <div>
                  <p className="font-semibold text-body-sm text-ink">{t.name}</p>
                  <p className="text-caption text-ink-faint">{t.role}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
