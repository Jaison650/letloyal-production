import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import Hero from '@/components/marketing/sections/Hero';
import SocialProof from '@/components/marketing/sections/SocialProof';
import Problem from '@/components/marketing/sections/Problem';
import HowItWorks from '@/components/marketing/sections/HowItWorks';
import Features from '@/components/marketing/sections/Features';
import CampaignTypes from '@/components/marketing/sections/CampaignTypes';
import LiveDemo from '@/components/marketing/sections/LiveDemo';
import Testimonials from '@/components/marketing/sections/Testimonials';
import Faq from '@/components/marketing/sections/Faq';
import FinalCta from '@/components/marketing/sections/FinalCta';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-page overflow-x-hidden">
      <MarketingNav tone="onDark" />
      <Hero />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <Features />
      <CampaignTypes />
      <LiveDemo />
      <Testimonials />
      <Faq />
      <FinalCta />
      <MarketingFooter />
    </div>
  );
}
