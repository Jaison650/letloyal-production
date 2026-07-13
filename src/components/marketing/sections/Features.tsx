'use client';
import { motion } from 'framer-motion';
import { Sparkles, Smartphone, Target, BarChart3, MapPin, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const FEATURES = [
  { icon: Sparkles, reward: false, title: 'Live in 10 Minutes', desc: 'No complex setup, no POS integration, no hardware required.' },
  { icon: Smartphone, reward: false, title: 'No App for Customers', desc: 'Customers scan with any phone camera — instant loyalty, zero friction.' },
  { icon: Target, reward: true, title: 'Visit & Spend Campaigns', desc: 'Run stamp-style or points-based rewards, or both simultaneously.' },
  { icon: BarChart3, reward: false, title: 'Live Dashboard', desc: "See today's scans, active customers, and redemptions in real time." },
  { icon: MapPin, reward: false, title: 'Multi-Location Ready', desc: 'One customer account works across all your locations seamlessly.' },
  { icon: ShieldCheck, reward: false, title: 'Privacy First', desc: 'Customer data is never sold or shared. Privacy-first by design.' },
];

export default function Features() {
  return (
    <section className="py-24 px-4 bg-surface-page">
      <div className="max-w-5xl mx-auto">
        <FadeUp className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Everything you need. Nothing you don&apos;t.</h2>
          <p className="text-ink-sub text-lg">Built specifically for local merchants.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card padding="lg" className="h-full hover:-translate-y-1 transition-transform duration-200">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.reward ? 'bg-reward-subtle text-reward-deep' : 'bg-teal-subtle text-teal'}`}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-display font-bold text-h4 text-ink mb-2">{f.title}</h3>
                <p className="text-ink-sub text-body-sm leading-relaxed">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
