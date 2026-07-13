'use client';
import { motion } from 'framer-motion';
import { BarChart3, RotateCcw, Trophy } from 'lucide-react';
import { Card } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const PROBLEMS = [
  { icon: BarChart3, title: 'Zero Data', desc: 'Paper cards give you no insight into who your loyal customers are or how often they return.' },
  { icon: RotateCcw, title: 'Cards Get Lost', desc: 'Customers forget them, lose them, start over — and your loyalty program resets every time.' },
  { icon: Trophy, title: 'No Competitive Edge', desc: 'While you hand out stamps, competitors run digital loyalty programs that drive real retention.' },
];

export default function Problem() {
  return (
    <section className="py-24 px-4 bg-surface-page">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Paper stamp cards are killing your retention</h2>
          <p className="text-ink-sub text-lg mb-14">Three reasons local businesses lose loyal customers every day.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid md:grid-cols-3 gap-6">
          {PROBLEMS.map((p) => (
            <motion.div key={p.title} variants={fadeUp}>
              <Card padding="lg" className="text-left h-full hover:-translate-y-1 transition-transform duration-200">
                <div className="w-11 h-11 bg-surface-2 rounded-xl flex items-center justify-center text-ink-sub mb-4"><p.icon size={22} /></div>
                <h3 className="font-display font-bold text-h3 text-ink mb-2">{p.title}</h3>
                <p className="text-ink-sub">{p.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
