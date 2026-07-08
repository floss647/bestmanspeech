import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WriteSpeech from "./pages/WriteSpeech";
import SpeechDashboard from "./pages/SpeechDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import Checkout from "./pages/Checkout";
import ResumePurchase from "./pages/ResumePurchase";
import ResumeForm from "./pages/ResumeForm";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import LandingPage from "./pages/LandingPage";
import Contact from "./pages/Contact";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import CookieBanner from "./components/CookieBanner";
import { GeolocationProvider } from "./contexts/GeolocationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GeolocationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/write" element={<WriteSpeech />} />
            <Route path="/speech" element={<SpeechDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/resume" element={<ResumePurchase />} />
            <Route path="/resume-form" element={<ResumeForm />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/:slug" element={<LandingPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </GeolocationProvider>
  </QueryClientProvider>
);

export default App;
