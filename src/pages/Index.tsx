import { EnhancedHeroSection } from "@/components/landing/EnhancedHeroSection";
import { FeaturesMenu } from "@/components/landing/FeaturesMenu";
import { FeatureShowcases } from "@/components/landing/FeatureShowcases";
import { OfficeBackendSection } from "@/components/landing/OfficeBackendSection";
import { VoiceTrainingDemo } from "@/components/landing/VoiceTrainingDemo";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { DemoSchedulingSection } from "@/components/landing/DemoSchedulingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { CustomerSupportChatbot } from "@/components/chat/CustomerSupportChatbot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <EnhancedHeroSection />
      
      <FeaturesMenu />
      
      <FeatureShowcases />
      
      <OfficeBackendSection />
      
      {/* Voice Training Demo Section */}
      <section className="py-16 sm:py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Experience Voice Training
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hear our AI voice trainer in action with this interactive demo
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <VoiceTrainingDemo />
          </div>
        </div>
      </section>
      
      <TestimonialsSection />
      
      <PricingSection />
      
      <DemoSchedulingSection />
      
      <CTASection />
      
      <Footer />
      
      {/* Customer Support Chatbot */}
      <CustomerSupportChatbot />
    </div>
  );
};

export default Index;
