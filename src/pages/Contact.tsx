import { ContactForm } from "@/components/forms/ContactForm";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";

const ContactPage = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      content: "+1 (555) 123-4567",
      subtext: "Mon-Fri 9AM-6PM PST"
    },
    {
      icon: Mail,
      title: "Email",
      content: "hello@memapos.com",
      subtext: "We respond within 24 hours"
    },
    {
      icon: MapPin,
      title: "Address",
      content: "123 Business Ave, Suite 100",
      subtext: "San Francisco, CA 94105"
    },
    {
      icon: Clock,
      title: "Support Hours",
      content: "24/7 Live Chat Support",
      subtext: "Always here to help you"
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Get in Touch</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about MemaPOS? We'd love to hear from you. 
              Reach out and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-foreground">{item.content}</p>
                      <p className="text-sm text-muted-foreground">{item.subtext}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Newsletter Signup */}
            <div>
              <h3 className="text-xl font-bold mb-4">Stay Updated</h3>
              <p className="text-muted-foreground mb-6">
                Subscribe to our newsletter for the latest updates, features, and industry insights.
              </p>
              <NewsletterForm />
            </div>

            <Separator />

            {/* Social Links */}
            <div>
              <h3 className="text-xl font-bold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a 
                      href={social.href}
                      aria-label={social.label}
                      className="hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 pt-12 border-t">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quick answers to common questions about MemaPOS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="font-semibold">How quickly can I get started?</h3>
              <p className="text-muted-foreground">
                Most businesses are up and running within 24-48 hours. Our team provides complete setup and training.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Do you offer 24/7 support?</h3>
              <p className="text-muted-foreground">
                Yes! We provide 24/7 live chat support and phone support during business hours.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Can I migrate my existing data?</h3>
              <p className="text-muted-foreground">
                Absolutely! We offer free data migration from most POS systems and help you preserve your customer history.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Is there a long-term contract?</h3>
              <p className="text-muted-foreground">
                No long-term contracts required. You can cancel anytime with 30 days notice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;