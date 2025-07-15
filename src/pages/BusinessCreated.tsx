import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Copy, 
  Download, 
  Users, 
  Settings,
  ArrowRight,
  PartyPopper
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BusinessCreated = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [copied, setCopied] = useState(false);
  const invitationCode = searchParams.get('code');
  const businessName = searchParams.get('name');

  useEffect(() => {
    if (!invitationCode) {
      navigate('/employee');
    }
  }, [invitationCode, navigate]);

  const copyToClipboard = async () => {
    if (!invitationCode) return;
    
    try {
      await navigator.clipboard.writeText(invitationCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invitation code copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the code",
        variant: "destructive"
      });
    }
  };

  const downloadCode = () => {
    if (!invitationCode) return;
    
    const content = `Business Invitation Code\n\nBusiness: ${businessName || 'Your Business'}\nInvitation Code: ${invitationCode}\n\nShare this code with employees to join your business.\nYou can always find this code in Settings > Team Management.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invitation-code-${invitationCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Invitation code saved to your device",
    });
  };

  const goToDashboard = () => {
    navigate('/employee');
  };

  if (!invitationCode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg"></div>
            <span className="text-2xl font-bold">Mema</span>
          </div>
          <div className="flex items-center justify-center mb-4">
            <PartyPopper className="h-12 w-12 text-primary mr-3" />
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Business Created Successfully!</h1>
          <p className="text-muted-foreground">
            {businessName ? `Welcome to ${businessName}` : 'Your business is ready to go'}
          </p>
        </div>

        {/* Invitation Code Card */}
        <Card className="bg-card shadow-elegant border-0 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl flex items-center justify-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Your Business Invitation Code
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Code Display */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">Invitation Code</p>
              <p className="text-4xl font-bold text-primary tracking-wider font-mono">
                {invitationCode}
              </p>
            </div>

            {/* Important Message */}
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertDescription className="text-center text-sm">
                <strong className="text-amber-700 dark:text-amber-400">IMPORTANT:</strong> Save this code! 
                Share it with employees so they can join your business.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={copyToClipboard}
                className="flex-1 h-12"
                variant={copied ? "secondary" : "default"}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
              
              <Button 
                onClick={downloadCode}
                variant="outline"
                className="flex-1 h-12"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Where to find later */}
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center text-sm text-muted-foreground mb-2">
                <Settings className="h-4 w-4 mr-2" />
                <span className="font-medium">Need this code later?</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You can always find your invitation code in <strong>Settings → Team Management</strong> 
                or whenever you invite new team members.
              </p>
            </div>

            {/* Continue Button */}
            <Button 
              onClick={goToDashboard}
              className="w-full h-12 text-lg"
              size="lg"
            >
              Continue to Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Ready to get started? Your dashboard has everything you need to manage your business.</p>
        </div>
      </div>
    </div>
  );
};

export default BusinessCreated;