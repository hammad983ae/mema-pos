import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
            <span className="text-2xl font-bold">MemaPOS</span>
          </div>
        </div>

        <Card className="bg-card shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Terms of Service</CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-slate max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using MemaPOS ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
                <p className="text-muted-foreground leading-relaxed">
                  MemaPOS is a cloud-based point-of-sale and business management platform designed specifically for skincare retail shops, spas, and beauty businesses. Our service includes inventory management, employee scheduling, sales tracking, and related business tools.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Account and Registration</h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>• You must provide accurate and complete registration information</p>
                  <p>• You are responsible for maintaining the security of your account</p>
                  <p>• You must notify us immediately of any unauthorized use of your account</p>
                  <p>• One person or legal entity may not maintain more than one account</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  You agree not to use the Service to:
                </p>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>• Upload, post, or transmit any content that is unlawful, harmful, or offensive</p>
                  <p>• Violate any applicable laws or regulations</p>
                  <p>• Interfere with or disrupt the Service or servers</p>
                  <p>• Attempt to gain unauthorized access to any portion of the Service</p>
                  <p>• Use the Service for any fraudulent or inappropriate purposes</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Payment and Billing</h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>• Subscription fees are billed in advance on a monthly or annual basis</p>
                  <p>• All fees are non-refundable except as required by law</p>
                  <p>• We reserve the right to change our pricing with 30 days notice</p>
                  <p>• Late payments may result in service suspension</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data and Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding your personal information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Service Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to maintain 99.9% uptime, but we do not guarantee uninterrupted access to the Service. We may perform maintenance that temporarily limits access with advance notice when possible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  MemaPOS shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Either party may terminate this agreement at any time. Upon termination, your right to use the Service will cease immediately. We may retain your data for a reasonable period to facilitate reactivation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For questions about these Terms of Service, please contact us at legal@memapos.com.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;