'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coffee, ArrowRight, Users } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { fadeUp, staggerContainer } from '../motion';

export default function Hero() {
  return (
    <section className="relative bg-section-dark -mt-16 pt-16 overflow-hidden">
      {/* radial glows */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 right-[-10%] w-[700px] h-[420px]" style={{ background: 'radial-gradient(closest-side, rgba(13,148,136,.22), transparent)' }} />
        <div className="absolute bottom-[-20%] left-[-8%] w-[480px] h-[300px]" style={{ background: 'radial-gradient(closest-side, rgba(242,184,36,.07), transparent)' }} />
      </div>

      <div className="max-w-5xl mx-auto text-center relative px-4 pt-16 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 text-[#9FE7CC] font-semibold text-body-sm px-4 py-2 rounded-full mb-7 border border-[#5EEAD4]/20 bg-[#5EEAD4]/[0.07]"
        >
          ● QR-simple loyalty · no app needed
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.06] tracking-[-0.03em] text-white mb-6"
        >
          Customers who keep{' '}
          <em className="font-serif italic font-medium text-[#F2C230] tracking-[-0.01em]">coming back.</em>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="text-lg sm:text-xl text-[#AEBDB5] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          One QR at your counter. Points land instantly, rewards redeem themselves,
          and your regulars become your growth engine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.26 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/merchant/register" className="inline-flex items-center gap-2 rounded-full bg-reward text-reward-fg font-bold text-lg px-9 py-4 hover:brightness-95 transition-[filter]">
            Start free — 2 min setup <ArrowRight size={18} />
          </Link>
          <a href="#how-it-works" className="inline-flex items-center rounded-full border border-white/20 bg-white/[0.08] text-white font-bold text-lg px-8 py-4 hover:bg-white/[0.14] transition-colors">
            See how it works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.38 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-5 text-body-sm text-[#7C8C84] font-medium"
        >
          <span>Trusted by merchants across</span>
          <span className="flex items-center gap-1.5 text-[#AEBDB5]">🇮🇳 India</span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1.5 text-[#9FE7CC] font-semibold"><Users size={14} /> India Pilot</span>
        </motion.div>

        {/* Hero visual — dark glass cards */}
        <motion.div variants={staggerContainer(0.15)} initial="hidden" animate="show" className="mt-16 flex flex-col lg:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
          <motion.div variants={fadeUp} className="bg-white/[0.06] backdrop-blur-sm rounded-[16px] border border-white/10 p-5 w-full max-w-xs text-left animate-float">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#6B3F2A] flex items-center justify-center"><Coffee size={14} className="text-white" /></div>
              <div>
                <p className="font-display font-bold text-sm text-white">BrewHouse Café</p>
                <p className="text-xs text-[#7C8C84]">Live Dashboard</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ label: 'Scans Today', val: '14' }, { label: 'Active Customers', val: '87' }].map((s) => (
                <div key={s.label} className="bg-white/[0.07] rounded-xl p-3">
                  <p className="text-xl font-display font-bold text-[#5EEAD4]">{s.val}</p>
                  <p className="text-xs text-[#7C8C84]">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 rounded-full" style={{ background: 'linear-gradient(90deg,#5EEAD4,#0D9488)' }} />
            </div>
            <p className="text-xs text-[#7C8C84] mt-1">Campaign progress</p>
          </motion.div>

          <motion.div variants={fadeUp} className="relative shrink-0">
            <div className="bg-gradient-brand rounded-3xl px-6 py-5 flex items-center justify-center shadow-xl animate-pulse-glow">
              <Logo variant="dark" size={38} />
            </div>
            <div className="absolute -top-3 -right-3 bg-reward text-reward-fg text-xs font-bold px-2 py-1 rounded-full">SCAN</div>
          </motion.div>

          <motion.div variants={fadeUp} className="bg-white/[0.06] backdrop-blur-sm rounded-[16px] border border-[#F2C230]/30 p-5 w-full max-w-xs text-left animate-float" style={{ animationDelay: '1s' }}>
            <p className="font-display font-bold text-sm text-white mb-1">Priya S.</p>
            <p className="text-xs text-[#7C8C84] mb-3">BrewHouse Café · 8/10 visits</p>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full w-4/5 rounded-full" style={{ background: 'linear-gradient(90deg,#F2C230,#E8A50F)' }} />
            </div>
            <p className="text-xs text-[#F2C230] font-semibold">2 more visits to Free Coffee! ☕</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
