'use client';
import { motion } from 'framer-motion';
import { RotateCcw, Gift } from 'lucide-react';
import { Card } from '@/components/ds';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

export default function CampaignTypes() {
  return (
    <section className="py-24 px-4 bg-surface-1">
      <div className="max-w-5xl mx-auto text-center">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em] mb-4">Two proven loyalty models</h2>
          <p className="text-ink-sub text-lg mb-14">Choose the one that fits your business — or run both.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.15)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid md:grid-cols-2 gap-6">
          <motion.div variants={fadeUp}>
            <Card padding="lg" className="text-left h-full border-teal/20 hover:border-teal transition-colors duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-subtle rounded-xl flex items-center justify-center text-teal"><RotateCcw size={20} /></div>
                <div>
                  <p className="font-display font-bold text-h4 text-ink">Stamp Card — Reimagined</p>
                  <p className="text-caption text-ink-faint">Visit-based</p>
                </div>
              </div>
              <p className="text-ink-sub mb-4">Reward customers for every visit. Classic loyalty, made digital. Perfect for cafés, salons, and gyms.</p>
              <div className="bg-teal-subtle rounded-xl p-4 mb-4">
                <p className="text-caption font-semibold text-ink-sub mb-2">Example:</p>
                <p className="font-display font-bold text-teal">Visit 10 times → Free coffee</p>
                <div className="mt-3 flex gap-1.5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`flex-1 h-3 rounded-full ${i < 7 ? 'bg-teal' : 'bg-surface-2'}`} />
                  ))}
                </div>
                <p className="text-caption text-ink-faint mt-2">7 / 10 visits</p>
              </div>
              <p className="text-caption text-ink-sub"><strong>Ideal for:</strong> Coffee shops · Salons · Gyms · Barbers</p>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card padding="lg" className="text-left h-full border-reward/40 hover:border-reward transition-colors duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-reward-subtle rounded-xl flex items-center justify-center text-reward-deep"><Gift size={20} /></div>
                <div>
                  <p className="font-display font-bold text-h4 text-ink">Spend to Earn</p>
                  <p className="text-caption text-ink-faint">Spend-based</p>
                </div>
              </div>
              <p className="text-ink-sub mb-4">Customers earn points on every purchase. Perfect for restaurants and retail where basket size matters.</p>
              <div className="bg-reward-subtle rounded-xl p-4 mb-4">
                <p className="text-caption font-semibold text-ink-sub mb-2">Example:</p>
                <p className="font-display font-bold text-reward-deep">Spend ₹1000 → Get ₹100 reward</p>
                <div className="mt-3 h-3 bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-reward" />
                </div>
                <p className="text-caption text-ink-faint mt-2">750 / 1000 points</p>
              </div>
              <p className="text-caption text-ink-sub"><strong>Ideal for:</strong> Restaurants · Retail · Boutiques · Spas</p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
