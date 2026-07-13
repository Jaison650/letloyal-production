import Link from 'next/link';
import { FadeUp } from '../motion';

export default function FinalCta() {
  return (
    <section className="relative py-24 px-4 bg-section-dark overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="max-w-3xl mx-auto text-center relative">
        <FadeUp>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-[-0.025em] mb-5 leading-tight">
            Turn first-time visitors into <em className="font-serif italic font-medium text-[#F2C230]">loyal customers.</em>
          </h2>
          <p className="text-[#AEBDB5] text-lg mb-10">Join the LetLoyal India Pilot — free to get started.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/register" className="inline-flex items-center justify-center rounded-full bg-reward text-reward-fg font-bold text-lg px-10 py-4 hover:brightness-95 transition-[filter]">
              Get Started Free
            </Link>
            <Link href="/my-rewards" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white font-bold text-lg px-8 py-4 hover:bg-white/[0.14] transition-colors">
              View My Rewards
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
