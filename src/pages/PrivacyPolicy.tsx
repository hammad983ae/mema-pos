import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
            <CardTitle className="text-3xl text-center">Privacy Policy</CardTitle>
            <p className="text-center text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-slate max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
                <div className="text-muted-foreground leading-relaxed space-y-3">
                  <div>
                    <h3 className="font-medium text-foreground">Personal Information</h3>
                    <p>We collect information you provide directly to us, such as when you create an account, including your name, email address, phone number, and business information.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Business Data</h3>
                    <p>We collect and store business-related data you input into our system, including customer information, inventory data, sales records, and employee schedules.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Usage Information</h3>
                    <p>We automatically collect information about how you use our Service, including access times, pages viewed, and features used.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>• Provide, maintain, and improve our Service</p>
                  <p>• Process transactions and send related information</p>
                  <p>• Send technical notices, updates, and support messages</p>
                  <p>• Respond to your comments, questions, and customer service requests</p>
                  <p>• Monitor and analyze trends and usage patterns</p>
                  <p>• Detect, investigate, and prevent fraudulent transactions</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Information Sharing and Disclosure</h2>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following circumstances:
                </p>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>• With your consent or at your direction</p>
                  <p>• To comply with legal obligations or court orders</p>
                  <p>• To protect our rights, property, or safety</p>
                  <p>• With service providers who assist in our operations (under strict confidentiality agreements)</p>
                  <p>• In connection with a merger, acquisition, or sale of all or part of our company</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>• We implement appropriate security measures to protect your personal information</p>
                  <p>• All data is encrypted in transit and at rest using industry-standard encryption</p>
                  <p>• We regularly update our security practices and conduct security audits</p>
                  <p>• Access to your data is limited to authorized personnel only</p>
                  <p>• We maintain regular backups to prevent data loss</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We retain your personal information for as long as necessary to provide you with our Service and as required by applicable law. When you cancel your account, we will delete your personal information within 90 days, though some information may be retained for legitimate business purposes or legal compliance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>• Access and review your personal information</p>
                  <p>• Correct inaccurate or outdated information</p>
                  <p>• Request deletion of your personal information</p>
                  <p>• Export your data in a portable format</p>
                  <p>• Opt out of marketing communications</p>
                  <p>• Object to certain processing of your information</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking Technologies</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Third-Party Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our Service may integrate with third-party services (such as payment processors). These third parties have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of these third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information during such transfers.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our Service is not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">11. Changes to This Privacy Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and sending you an email notification.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at privacy@memapos.com or write to us at our business address.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;