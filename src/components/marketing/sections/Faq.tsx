import FaqAccordion from '@/components/homepage/FaqAccordion';
import { FadeUp } from '../motion';

export default function Faq() {
  return (
    <section id="faq" className="py-24 px-4 bg-surface-page">
      <div className="max-w-3xl mx-auto">
        <FadeUp className="text-center mb-14">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-[-0.02em]">Frequently asked questions</h2>
        </FadeUp>
        <FaqAccordion />
      </div>
    </section>
  );
}
