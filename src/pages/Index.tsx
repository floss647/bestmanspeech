import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SpeechTypes from "@/components/SpeechTypes";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import SampleSpeeches from "@/components/SampleSpeeches";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AsSeenIn from "@/components/AsSeenIn";
import SpeechSuiteShowcase from "@/components/SpeechSuiteShowcase";
import ReviewsWidget from "@/components/ReviewsWidget";
import RehearsalShowcase from "@/components/RehearsalShowcase";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ReviewsWidget />
      <AsSeenIn />
      <SpeechTypes />
      <HowItWorks />
      <SpeechSuiteShowcase showVideo={false} />
      <RehearsalShowcase tone="dark" />
      <Pricing />
      <SampleSpeeches />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
