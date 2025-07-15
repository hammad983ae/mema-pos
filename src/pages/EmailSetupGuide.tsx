import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Shield, 
  Key, 
  Settings, 
  CheckCircle, 
  ExternalLink,
  ArrowRight,
  AlertCircle,
  Copy
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "react-router-dom";

export const EmailSetupGuide = () => {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      id: "signup",
      title: "Sign up for Resend",
      description: "Create a free Resend account to send emails",
      details: [
        "Go to resend.com and click 'Sign Up'",
        "Complete the registration process",
        "Verify your email address",
        "Log into your dashboard"
      ],
      link: "https://resend.com",
      linkText: "Go to Resend"
    },
    {
      id: "domain",
      title: "Add & Verify Your Domain",
      description: "Add your business domain to send emails from your own address",
      details: [
        "In Resend dashboard, go to 'Domains'",
        "Click 'Add Domain' and enter your domain (e.g., yourcompany.com)",
        "Add the provided DNS records to your domain registrar",
        "Wait for verification (can take up to 48 hours)"
      ],
      note: "Without domain verification, emails will be sent from onboarding@resend.dev",
      link: "https://resend.com/domains",
      linkText: "Manage Domains"
    },
    {
      id: "api-key",
      title: "Create API Key",
      description: "Generate an API key for the application to use",
      details: [
        "Go to 'API Keys' in your Resend dashboard",
        "Click 'Create API Key'",
        "Give it a name like 'Payroll System'",
        "Set permissions to 'Sending access'",
        "Copy the generated API key immediately"
      ],
      warning: "Save the API key immediately - you won't be able to see it again!",
      link: "https://resend.com/api-keys",
      linkText: "Create API Key"
    },
    {
      id: "configure",
      title: "Configure Email Settings",
      description: "Set up your email configuration in the payroll settings",
      details: [
        "Go to your Payroll Settings in this application",
        "Fill in the Email Configuration section:",
        "• Sender Email: payroll@yourcompany.com",
        "• Sender Name: Your Company Payroll",
        "• Reply-To Email: hr@yourcompany.com (optional)",
        "• Reply-To Name: HR Department (optional)"
      ],
      note: "Make sure to use an email address from your verified domain"
    },
    {
      id: "test",
      title: "Test Your Setup",
      description: "Send a test payroll email to verify everything works",
      details: [
        "Generate a test payroll for an employee",
        "Make sure the employee has a payroll email configured",
        "Send the payroll email",
        "Check that the email arrives from your domain",
        "Verify reply-to addresses work correctly"
      ]
    }
  ];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Email Setup Guide</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Follow these steps to configure your own email domain for sending payroll emails. 
          This ensures emails come from your business and replies go directly to you.
        </p>
      </div>

      {/* Overview Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            What You'll Achieve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Professional Emails</h4>
              <p className="text-sm text-muted-foreground">
                Send payroll emails from your business domain (e.g., payroll@yourcompany.com)
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Direct Replies</h4>
              <p className="text-sm text-muted-foreground">
                Employee replies go directly to your HR or payroll team
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Better Deliverability</h4>
              <p className="text-sm text-muted-foreground">
                Verified domains have better email deliverability rates
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Brand Consistency</h4>
              <p className="text-sm text-muted-foreground">
                Maintain your brand in all employee communications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Step-by-Step Setup</h2>
        
        {steps.map((step, index) => (
          <Card key={step.id} className="relative">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">{step.description}</p>
                </div>
                {step.link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={step.link} target="_blank" rel="noopener noreferrer">
                      {step.linkText}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pl-16">
              <ul className="space-y-2">
                {step.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{detail}</span>
                  </li>
                ))}
              </ul>
              
              {step.note && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">{step.note}</p>
                  </div>
                </div>
              )}
              
              {step.warning && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">{step.warning}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Example Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Example Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Here's an example of how your email configuration might look:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Sender Email:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("payroll@acmecorp.com", "sender-email")}
                  className="h-6 px-2"
                >
                  {copiedStep === "sender-email" ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <code className="text-sm bg-background px-2 py-1 rounded">payroll@acmecorp.com</code>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Sender Name:</span>
              <code className="text-sm bg-background px-2 py-1 rounded">ACME Corp Payroll</code>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Reply-To Email:</span>
              <code className="text-sm bg-background px-2 py-1 rounded">hr@acmecorp.com</code>
            </div>
            
            <div className="space-y-2">
              <span className="text-sm font-medium">Reply-To Name:</span>
              <code className="text-sm bg-background px-2 py-1 rounded">HR Department</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm">Emails not being delivered?</h4>
              <p className="text-sm text-muted-foreground">
                Check your spam folder and ensure your domain is properly verified in Resend.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm">Domain verification taking too long?</h4>
              <p className="text-sm text-muted-foreground">
                DNS changes can take up to 48 hours to propagate. You can use the default sender in the meantime.
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-sm">API key not working?</h4>
              <p className="text-sm text-muted-foreground">
                Make sure you copied the full API key and that it has sending permissions in Resend.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle className="h-5 w-5" />
            Ready to Configure?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you've completed the steps above, head to your payroll settings to configure your email.
          </p>
          <Button asChild>
            <NavLink to="/payroll">
              Go to Payroll Settings
              <ArrowRight className="h-4 w-4 ml-2" />
            </NavLink>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};