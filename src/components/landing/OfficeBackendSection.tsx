import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Gavel, CreditCard, Calculator, Shield, Zap, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const OfficeBackendSection = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calculator,
      title: "One-Click Payroll",
      description: "Generate and email payrolls in seconds, not hours",
      highlights: ["Automated calculations", "Tax compliance", "Direct email delivery"],
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: Gavel,
      title: "AI Legal Defense",
      description: "Fight disputes with AI-powered legal assistance",
      highlights: ["Evidence generation", "Legal document drafting", "Case analysis"],
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: CreditCard,
      title: "Smart Billing",
      description: "Automated invoicing and payment processing",
      highlights: ["Recurring billing", "Payment tracking", "Dispute management"],
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: FileText,
      title: "Document Automation",
      description: "Generate contracts, reports, and compliance docs instantly",
      highlights: ["Template library", "Auto-fill data", "Digital signatures"],
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const stats = [
    { value: "95%", label: "Time Saved", icon: Clock },
    { value: "99.9%", label: "Accuracy Rate", icon: CheckCircle },
    { value: "24/7", label: "AI Support", icon: Shield },
    { value: "3 Sec", label: "Processing Time", icon: Zap }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-sm font-medium">
            <Shield className="w-4 h-4 mr-2" />
            Enterprise Office Backend
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Automate Your Office
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"> Operations</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform your back-office operations with AI-powered automation. From payroll to legal disputes, 
            handle everything in clicks, not hours.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-0">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-white dark:bg-slate-800">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground mb-6 text-lg">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.highlights.map((highlight, hIndex) => (
                    <li key={hIndex} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Showcase */}
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-0 p-8 md:p-12 text-center">
          <CardContent className="p-0">
            <div className="flex justify-center mb-6">
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-4 text-foreground">
              Ready to Transform Your Operations?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses who've automated their office operations. 
              Start with our AI-powered payroll system and legal dispute assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate("/payroll")}
              >
                <Calculator className="w-5 h-5 mr-2" />
                Try Payroll Demo
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate("/chargeback-disputes")}
              >
                <Gavel className="w-5 h-5 mr-2" />
                See Legal AI
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};