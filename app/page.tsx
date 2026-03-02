import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import MadePossibleWith from '@/components/MadePossibleWith';
import Stats from '@/components/Stats';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import BackgroundGrid from '@/components/BackgroundGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-[#3ECF8E] selection:text-black">
      <BackgroundGrid />
      <Navbar />
      <Hero />
      <Features />
      <MadePossibleWith />
      <Stats />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
