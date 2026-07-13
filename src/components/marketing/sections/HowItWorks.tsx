'use client';
import { motion } from 'framer-motion';
import { Settings2, Scan, TrendingUp } from 'lucide-react';
import { FadeUp } from '../motion';

const STEPS = [
  { num: '01', icon: Settings2, title: 'Set Up Your Program', desc: 'Sign up, choose visit-based or spend-based rewards, and set your threshold. Your QR code is ready instantly.' },
  { num: '02', icon: Scan, title: 'Display Your QR', desc: 'Print it, frame it, or show it on your phone. Customers scan and automatically join — no app needed.' },
  { num: '03', icon: TrendingUp, title: 'Watch Customers Return', desc: "Your dashboard shows who's earning, who's close to a reward, and your real re-scan rate." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-surface-1">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Up and running in 3 steps</h2>
          <p className="text-ink-sub text-lg mb-16">From signup to your first customer scan in under 10 minutes.</p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:flex absolute top-10 left-[calc(33%+20px)] right-[calc(33%+20px)] items-center justify-between" aria-hidden>
            <div className="flex-1 h-0.5 bg-stroke" />
          </div>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: i === 0 ? -40 : i === 2 ? 40 : 0, y: i === 1 ? 20 : 0 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-teal rounded-2xl flex items-center justify-center text-teal-fg mb-5 shadow-ds relative z-10"><step.icon size={28} /></div>
              <p className="text-label uppercase text-teal mb-2">{step.num}</p>
              <h3 className="font-display font-bold text-h3 text-ink mb-3">{step.title}</h3>
              <p className="text-ink-sub leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
