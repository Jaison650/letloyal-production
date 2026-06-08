'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, Settings2, BarChart3, Star, Smartphone, Scan,
  Target, ShieldCheck, MapPin,
  Coffee, Scissors, Dumbbell, ShoppingBag, Pizza, Sparkles,
  ArrowRight, Users, ChevronRight, RotateCcw, Gift,
} from 'lucide-react';
import HomeNav from '@/components/homepage/HomeNav';
import FaqAccordion from '@/components/homepage/FaqAccordion';
import Logo from '@/components/ui/Logo';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const staggerContainer = (stagger = 0.1) => ({
  hidden: {},
  show:   { transition: { staggerChildren: stagger } },
});
function FadeUp({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }} className={className}>
      {children}
    </motion.div>
  );
}

const DEMO_MERCHANTS = [
  { slug: 'brewhouse-cafe', name: 'BrewHouse Café',   color: '#6B3F2A', reward: '10 visits → Free Coffee' },
  { slug: 'bella-beauty',   name: 'Bella Beauty',     color: '#7B2D8B', reward: '8 visits → Free Treatment' },
  { slug: 'the-fit-club',   name: 'The Fit Club',     color: '#1A6B2F', reward: '12 visits → Free PT Session' },
  { slug: 'metro-deli',     name: 'Metro Deli',        color: '#D4820A', reward: '₹1000 spent → ₹100 off' },
  { slug: 'luxe-boutique',  name: 'Luxe Boutique',    color: '#C0392B', reward: '₹2000 spent → ₹200 Voucher' },
  { slug: 'casa-pizzeria',  name: 'Casa Pizzeria',    color: '#E65C00', reward: '₹800 spent → Free Pizza' },
];

const FEATURES = [
  { icon: <Sparkles size={22} />, title: 'Live in 10 Minutes',       desc: 'No complex setup, no POS integration, no hardware required.' },
  { icon: <Smartphone size={22} />, title: 'No App for Customers',   desc: 'Customers scan with any phone camera — instant loyalty, zero friction.' },
  { icon: <Target size={22} />, title: 'Visit & Spend Campaigns',    desc: 'Run stamp-style or points-based rewards, or both simultaneously.' },
  { icon: <BarChart3 size={22} />, title: 'Live Dashboard',          desc: "See today's scans, active customers, and redemptions in real time." },
  { icon: <MapPin size={22} />, title: 'Multi-Location Ready',       desc: 'One customer account works across all your locations seamlessly.' },
  { icon: <ShieldCheck size={22} />, title: 'Privacy First',         desc: 'Customer data is never sold or shared. Privacy-first by design.' },
];

const STEPS = [
  { num: '01', icon: <Settings2 size={28} />, title: 'Set Up Your Program',    desc: 'Sign up, choose visit-based or spend-based rewards, and set your threshold. Your QR code is ready instantly.' },
  { num: '02', icon: <Scan size={28} />,      title: 'Display Your QR',        desc: 'Print it, frame it, or show it on your phone. Customers scan and automatically join — no app needed.' },
  { num: '03', icon: <TrendingUp size={28} />, title: 'Watch Customers Return', desc: "Your dashboard shows who's earning, who's close to a reward, and your real re-scan rate." },
];

const TESTIMONIALS = [
  { name: 'Rahul M.',  role: 'Café Owner, Bengaluru',   quote: 'I had my QR code live in 8 minutes. The first week, 12 customers signed up. My regulars now ask me about their points.' },
  { name: 'Priya L.',  role: 'Salon Manager, Mumbai',   quote: 'Paper stamp cards were a nightmare — customers lost them, started over constantly. LetLoyal solved all of that overnight.' },
  { name: 'Arjun P.',  role: 'Gym Owner, Hyderabad',    quote: 'The dashboard shows me exactly who is close to a reward. I can push them over the line with a personal message. Brilliant.' },
];


export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-bg overflow-x-hidden">
      <HomeNav />

      {/* HERO */}
      <section className="relative pt-20 pb-28 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2 bg-accent/15 text-primary font-semibold text-sm px-4 py-2 rounded-full mb-6 border border-accent/30">
            <Sparkles size={14} /> New: Spend-based campaigns now available
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="font-jakarta font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] text-text-dark mb-6">
            Give Every Customer<br />
            <span className="text-gradient">a Reason to Come Back</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }} className="text-lg sm:text-xl text-text-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            LetLoyal turns your QR code into a professional loyalty program.<br className="hidden sm:block" />
            No app. No hardware. Live in 10 minutes.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.26 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/merchant/login" className="btn-primary text-lg px-10 py-4">Start for Free <ArrowRight size={18} /></Link>
            <a href="#how-it-works" className="btn-ghost text-lg px-8 py-4">See How It Works</a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.38 }} className="mt-12 flex flex-wrap items-center justify-center gap-5 text-sm text-text-light font-medium">
            <span>Trusted by merchants across</span>
            <span className="flex items-center gap-1.5">🇮🇳 India</span>
            <span className="text-brand-border">·</span>
            <span className="flex items-center gap-1.5 text-accent font-semibold"><Users size={14} /> India Pilot</span>
          </motion.div>

          {/* Hero visual */}
          <motion.div variants={staggerContainer(0.15)} initial="hidden" animate="show" className="mt-16 flex flex-col lg:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-card-hover border border-brand-border p-5 w-full max-w-xs text-left animate-float">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#6B3F2A] flex items-center justify-center"><Coffee size={14} className="text-white" /></div>
                <div><p className="font-jakarta font-bold text-sm">BrewHouse Café</p><p className="text-xs text-text-light">Live Dashboard</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[{ label: 'Scans Today', val: '14' }, { label: 'Active Customers', val: '87' }].map((s) => (
                  <div key={s.label} className="bg-primary-light rounded-xl p-3">
                    <p className="text-xl font-jakarta font-bold text-primary">{s.val}</p>
                    <p className="text-xs text-text-light">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                <div className="h-full w-3/4 rounded-full" style={{ background: 'linear-gradient(90deg,#5EEAD4,#0D9488)' }} />
              </div>
              <p className="text-xs text-text-light mt-1">Campaign progress</p>
            </motion.div>

            <motion.div variants={fadeUp} className="relative shrink-0">
              <div className="bg-gradient-brand rounded-3xl px-6 py-5 flex items-center justify-center shadow-xl animate-pulse-glow">
                <Logo variant="dark" size={38} />
              </div>
              <div className="absolute -top-3 -right-3 bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">SCAN</div>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white rounded-2xl shadow-card-hover border-2 border-accent p-5 w-full max-w-xs text-left animate-float" style={{ animationDelay: '1s' }}>
              <p className="font-jakarta font-bold text-sm mb-1">Priya S.</p>
              <p className="text-xs text-text-light mb-3">BrewHouse Café · 8/10 visits</p>
              <div className="h-2.5 bg-brand-border rounded-full overflow-hidden mb-2">
                <div className="h-full w-4/5 rounded-full" style={{ background: 'linear-gradient(90deg,#5EEAD4,#0D9488)' }} />
              </div>
              <p className="text-xs text-accent font-semibold">2 more visits to Free Coffee! ☕</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <div className="relative bg-primary/5 border-y border-primary/10 py-4 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-primary/5 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-primary/5 to-transparent z-10 pointer-events-none" />
        <div className="flex animate-marquee whitespace-nowrap gap-10">
          {[...Array(2)].map((_, k) => (
            <span key={k} className="flex items-center gap-10 text-sm font-semibold text-text-medium">
              <span className="flex items-center gap-2"><Coffee size={14} className="text-primary" /> Cafés</span>
              <span>·</span>
              <span className="flex items-center gap-2"><Scissors size={14} className="text-primary" /> Salons</span>
              <span>·</span>
              <span className="flex items-center gap-2"><Dumbbell size={14} className="text-primary" /> Gyms</span>
              <span>·</span>
              <span className="flex items-center gap-2"><ShoppingBag size={14} className="text-primary" /> Retail</span>
              <span>·</span>
              <span className="flex items-center gap-2"><ShoppingBag size={14} className="text-primary" /> Boutiques</span>
              <span>·</span>
              <span className="flex items-center gap-2"><Pizza size={14} className="text-primary" /> Restaurants</span>
              <span>·</span>
              <span className="flex items-center gap-2"><Sparkles size={14} className="text-primary" /> Spas</span>
              <span>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* PROBLEM SECTION */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-jakarta font-bold text-3xl sm:text-4xl mb-4">Paper Stamp Cards Are Killing Your Retention</h2>
            <p className="text-text-medium text-lg mb-14">Three reasons local businesses lose loyal customers every day.</p>
          </FadeUp>
          <motion.div variants={staggerContainer(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '📊', title: 'Zero Data',           desc: 'Paper cards give you no insight into who your loyal customers are or how often they return.' },
              { icon: '😩', title: 'Cards Get Lost',       desc: 'Customers forget them, lose them, start over — and your loyalty program resets every time.' },
              { icon: '🏆', title: 'No Competitive Edge', desc: 'While you hand out stamps, competitors run digital loyalty programs that drive real retention.' },
            ].map((p) => (
              <motion.div key={p.title} variants={fadeUp} className="card text-left hover:-translate-y-1 transition-transform duration-200">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="font-jakarta font-bold text-xl mb-2">{p.title}</h3>
                <p className="text-text-medium">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-jakarta font-bold text-3xl sm:text-4xl mb-4">Up and Running in 3 Steps</h2>
            <p className="text-text-medium text-lg mb-16">From signup to your first customer scan in under 10 minutes.</p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:flex absolute top-10 left-[calc(33%+20px)] right-[calc(33%+20px)] items-center justify-between">
              <div className="flex-1 h-0.5 bg-gradient-to-r from-accent to-primary" />
            </div>
            {STEPS.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, x: i === 0 ? -40 : i === 2 ? 40 : 0, y: i === 1 ? 20 : 0 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-brand rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg relative z-10">{step.icon}</div>
                <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">{step.num}</p>
                <h3 className="font-jakarta font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-text-medium leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-16">
            <h2 className="font-jakarta font-bold text-3xl sm:text-4xl mb-4">Everything You Need. Nothing You Don&apos;t.</h2>
            <p className="text-text-medium text-lg">Built specifically for local merchants.</p>
          </FadeUp>
          <motion.div variants={staggerContainer(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="card hover:-translate-y-1 transition-transform duration-200">
                <div className="w-11 h-11 bg-primary-light rounded-xl flex items-center justify-center text-primary mb-4">{f.icon}</div>
                <h3 className="font-jakarta font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-text-medium text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CAMPAIGN TYPES */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-jakarta font-bold text-3xl sm:text-4xl mb-4">Two Proven Loyalty Models</h2>
            <p className="text-text-medium text-lg mb-14">Choose the one that fits your business — or run both.</p>
          </FadeUp>
          <motion.div variants={staggerContainer(0.15)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="grid md:grid-cols-2 gap-6">
            <motion.div variants={fadeUp} className="card text-left border-2 border-primary/20 hover:border-primary transition-colors duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary"><RotateCcw size={20} /></div>
                <div><p className="font-jakarta font-bold text-lg">Stamp Card — Reimagined</p><p className="text-xs text-text-light">Visit-based</p></div>
              </div>
              <p className="text-text-medium mb-4">Reward customers for every visit. Classic loyalty, made digital. Perfect for cafés, salons, and gyms.</p>
              <div className="bg-primary-light rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-text-medium mb-2">Example:</p>
                <p className="font-jakarta font-bold text-primary">Visit 10 times → Free coffee</p>
                <div className="mt-3 flex gap-1.5">
                  {[...Array(10)].map((_, i) => (<div key={i} className={`flex-1 h-3 rounded-full ${i < 7 ? 'bg-primary' : 'bg-brand-border'}`} />))}
                </div>
                <p className="text-xs text-text-light mt-2">7 / 10 visits</p>
              </div>
              <p className="text-xs text-text-medium"><strong>Ideal for:</strong> Coffee shops · Salons · Gyms · Barbers</p>
            </motion.div>

            <motion.div variants={fadeUp} className="card text-left border-2 border-accent/20 hover:border-accent transition-colors duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center text-accent"><Gift size={20} /></div>
                <div><p className="font-jakarta font-bold text-lg">Spend to Earn</p><p className="text-xs text-text-light">Spend-based</p></div>
              </div>
              <p className="text-text-medium mb-4">Customers earn points on every purchase. Perfect for restaurants and retail where basket size matters.</p>
              <div className="bg-accent/10 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-text-medium mb-2">Example:</p>
                <p className="font-jakarta font-bold text-accent">Spend ₹1000 → Get ₹100 reward</p>
                <div className="mt-3 h-3 bg-brand-border rounded-full overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-accent" />
                </div>
                <p className="text-xs text-text-light mt-2">750 / 1000 points</p>
              </div>
              <p className="text-xs text-text-medium"><strong>Ideal for:</strong> Restaurants · Retail · Boutiques · Spas</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LIVE DEMO PREVIEW */}
      <section className="py-24 px-4 bg-gradient-brand">
        <div className="max-w-5xl mx-auto text-center text-white">
          <FadeUp>
            <h2 className="font-jakarta font-bold text-3xl sm:text-4xl mb-4">See It In Action</h2>
            <p className="text-white/80 text-lg mb-12">Real merchants, real rewards. No signup required to explore.</p>
          </FadeUp>
          <motion.div variants={staggerContainer(0.07)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {DEMO_MERCHANTS.map((m) => (
              <motion.div key={m.slug} variants={fadeUp}>
                <Link href="/merchant/login" className="block bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-1">
                  <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center" style={{ background: m.color }}>
                    <Coffee size={16} className="text-white" />
                  </div>
                  <p className="font-jakarta font-bold text-sm">{m.name}</p>
                  <p className="text-white/60 text-xs mt-1">{m.reward}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/login" className="btn-primary text-lg px-10 py-4">Try the Live Demo <ChevronRight size={18} /></Link>
            <Link href="/my-rewards" className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold rounded-full px-8 py-4 text-lg transition-all">View My Rewards</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <FadeUp>
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-yellow-200 mb-6">India Pilot Merchants</div>
            <h2 className="font-jakarta font-bold text-3xl sm:text-4xl mb-14">What Merchants Are Saying</h2>
          </FadeUp>
          <motion.div variants={staggerContainer(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={fadeUp} className="card text-left">
                <div className="flex gap-0.5 mb-4">{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#5EEAD4" stroke="#5EEAD4" />)}</div>
                <p className="text-text-dark leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                <div><p className="font-semibold text-sm">{t.name}</p><p className="text-xs text-text-light">{t.role}</p></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <FadeUp className="text-center mb-14">
            <h2 className="font-jakarta font-bold text-3xl sm:text-4xl">Frequently Asked Questions</h2>
          </FadeUp>
          <FaqAccordion />
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="relative py-24 px-4 bg-gradient-brand overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-3xl mx-auto text-center text-white relative">
          <FadeUp>
            <h2 className="font-jakarta font-bold text-3xl sm:text-5xl mb-5 leading-tight">Ready to Turn First-Time Visitors Into Loyal Customers?</h2>
            <p className="text-white/80 text-lg mb-10">Join the LetLoyal India Pilot — free to get started.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/merchant/login" className="btn-primary text-lg px-10 py-4">Get Started Free</Link>
              <Link href="/my-rewards" className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold rounded-full px-8 py-4 text-lg transition-all">View My Rewards</Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary-dark text-white/70 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            <div>
              <div className="mb-2"><Logo variant="dark" size={26} /></div>
              <p className="text-sm max-w-xs leading-relaxed">QR-first loyalty for local merchants.<br />No app. No hardware. Just loyal customers.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold text-white mb-3">Product</p>
                <ul className="space-y-2">
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#faq"           className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">For Customers</p>
                <ul className="space-y-2">
                  <li><Link href="/my-rewards" className="hover:text-white transition-colors">My Rewards</Link></li>
                  <li><Link href="/my-rewards" className="hover:text-white transition-colors">Register</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">Merchant</p>
                <ul className="space-y-2">
                  <li><Link href="/merchant/login" className="hover:text-white transition-colors">Merchant Login</Link></li>
                  <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-xs text-center">
            © 2026 LetLoyal. India Pilot. 🇮🇳
          </div>
        </div>
      </footer>
    </div>
  );
}
