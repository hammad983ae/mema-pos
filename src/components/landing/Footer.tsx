import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Linkedin, 
  Instagram,
  Shield,
  Clock,
  Star,
  ExternalLink
} from "lucide-react";

export const Footer = () => {
  const quickLinks = [
    { name: "POS Demo", href: "/pos" },
    { name: "Analytics", href: "/analytics" },
    { name: "Inventory", href: "/inventory" },
    { name: "Team Tools", href: "/team" },
    { name: "Pricing", href: "#pricing" },
    { name: "Schedule Demo", href: "#demo" }
  ];

  const company = [
    { name: "About Us", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press Kit", href: "#" },
    { name: "Partner Program", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Contact", href: "#" }
  ];

  const legal = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Security", href: "#" },
    { name: "Compliance", href: "#" },
    { name: "API Terms", href: "#" }
  ];

  const integrations = [
    { name: "QuickBooks", href: "#" },
    { name: "Shopify", href: "#" },
    { name: "Square", href: "#" },
    { name: "Mailchimp", href: "#" },
    { name: "Zapier", href: "#" }
  ];

  return (
    <footer className="bg-gradient-to-br from-background via-muted/10 to-background border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl shadow-glow"></div>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Mema
                </span>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-sm">
                Built by cosmetics shop owners, for cosmetics shop owners. 
                The complete business management platform for your beauty business.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>hello@mema.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>1-800-MEMA (636-2)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>San Francisco, CA • New York, NY</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-muted hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-glow group">
                  <Twitter className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground" />
                </a>
                <a href="#" className="w-10 h-10 bg-muted hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-glow group">
                  <Linkedin className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground" />
                </a>
                <a href="#" className="w-10 h-10 bg-muted hover:bg-primary rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-glow group">
                  <Instagram className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Platform</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors animated-underline"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-3">
                {company.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors animated-underline"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Integrations */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Integrations</h3>
              <ul className="space-y-3">
                {integrations.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors animated-underline flex items-center"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-3 mb-6">
                {legal.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-primary transition-colors animated-underline"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Trust Badges */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 text-success" />
                  <span>SOC 2 Certified</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 text-success" />
                  <span>99.9% Uptime SLA</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 text-warning" />
                  <span>4.9/5 Customer Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="opacity-50" />

        {/* Bottom Section */}
        <div className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © 2024 Mema Technologies, Inc. All rights reserved. Built for cosmetics shop owners.
            </p>
            <div className="flex items-center space-x-6 text-xs text-muted-foreground">
              <span>Made with ❤️ for cosmetics professionals</span>
              <span>•</span>
              <span>Version 2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};