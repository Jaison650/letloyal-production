'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coffee, ChevronRight } from 'lucide-react';
import { fadeUp, staggerContainer, FadeUp } from '../motion';

const DEMO_MERCHANTS = [
  { slug: 'brewhouse-cafe', name: 'BrewHouse Café', color: '#6B3F2A', reward: '10 visits → Free Coffee' },
  { slug: 'bella-beauty', name: 'Bella Beauty', color: '#7B2D8B', reward: '8 visits → Free Treatment' },
  { slug: 'the-fit-club', name: 'The Fit Club', color: '#1A6B2F', reward: '12 visits → Free PT Session' },
  { slug: 'metro-deli', name: 'Metro Deli', color: '#D4820A', reward: '₹1000 spent → ₹100 off' },
  { slug: 'luxe-boutique', name: 'Luxe Boutique', color: '#C0392B', reward: '₹2000 spent → ₹200 Voucher' },
  { slug: 'casa-pizzeria', name: 'Casa Pizzeria', color: '#E65C00', reward: '₹800 spent → Free Pizza' },
];

export default function LiveDemo() {
  return (
    <section className="relative py-24 px-4 bg-section-dark overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[-30%] left-[15%] w-[600px] h-[380px]" style={{ background: 'radial-gradient(closest-side, rgba(13,148,136,.16), transparent)' }} />
      </div>
      <div className="max-w-5xl mx-auto text-center relative">
        <FadeUp>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-[-0.02em] mb-4">See it in action</h2>
          <p className="text-[#AEBDB5] text-lg mb-12">Explore what LetLoyal looks like for your business — sign in to see the live dashboard.</p>
        </FadeUp>
        <motion.div variants={staggerContainer(0.07)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {DEMO_MERCHANTS.map((m) => (
            <motion.div key={m.slug} variants={fadeUp}>
              <Link href="/merchant/login" className="block bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-[16px] p-4 text-left transition-all duration-200 hover:-translate-y-1">
                <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: m.color }}>
                  <Coffee size={16} className="text-white" />
                </div>
                <p className="font-display font-bold text-sm text-white">{m.name}</p>
                <p className="text-[#F2C230] text-xs mt-1 font-semibold">{m.reward}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/merchant/register" className="inline-flex items-center justify-center gap-1 rounded-full bg-reward text-reward-fg font-bold text-lg px-10 py-4 hover:brightness-95 transition-[filter]">
            Get Started Free <ChevronRight size={18} />
          </Link>
          <Link href="/my-rewards" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white font-bold text-lg px-8 py-4 hover:bg-white/[0.14] transition-colors">
            View My Rewards
          </Link>
        </div>
      </div>
    </section>
  );
}
