import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  Clock
} from "lucide-react";

interface PaymentGateway {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'backup';
  status: 'online' | 'offline' | 'error' | 'testing';
  priority: number;
  lastResponse?: number;
  errorCount: number;
  maxRetries: number;
}

interface PaymentGatewayManagerProps {
  onGatewayChange?: (activeGateway: PaymentGateway) => void;
}

export const PaymentGatewayManager = ({ onGatewayChange }: PaymentGatewayManagerProps) => {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<PaymentGateway[]>([
    {
      id: 'stripe_terminal',
      name: 'Stripe Terminal',
      type: 'primary',
      status: 'online',
      priority: 1,
      lastResponse: 120,
      errorCount: 0,
      maxRetries: 3
    },
    {
      id: 'square_pos',
      name: 'Square POS',
      type: 'secondary',
      status: 'online',
      priority: 2,
      lastResponse: 180,
      errorCount: 0,
      maxRetries: 3
    },
    {
      id: 'paypal_zettle',
      name: 'PayPal Zettle',
      type: 'backup',
      status: 'offline',
      priority: 3,
      lastResponse: 999,
      errorCount: 1,
      maxRetries: 2
    }
  ]);

  const [activeGateway, setActiveGateway] = useState<PaymentGateway | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    // Find the best available gateway
    const availableGateway = gateways
      .filter(g => g.status === 'online')
      .sort((a, b) => a.priority - b.priority)[0];

    if (availableGateway && availableGateway.id !== activeGateway?.id) {
      setActiveGateway(availableGateway);
      onGatewayChange?.(availableGateway);
    }
  }, [gateways, activeGateway, onGatewayChange]);

  // Simulate real-time gateway monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setGateways(prev => prev.map(gateway => ({
        ...gateway,
        lastResponse: gateway.status === 'online' 
          ? Math.floor(Math.random() * 300) + 50
          : gateway.lastResponse + Math.floor(Math.random() * 100),
        status: gateway.status === 'online' && Math.random() > 0.95 
          ? 'error' 
          : gateway.status === 'error' && Math.random() > 0.7
          ? 'online'
          : gateway.status
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testGatewayConnection = async (gatewayId: string) => {
    setIsTestingConnection(true);
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGateways(prev => prev.map(g => 
        g.id === gatewayId 
          ? { ...g, status: 'online', errorCount: 0, lastResponse: Math.floor(Math.random() * 200) + 50 }
          : g
      ));

      toast({
        title: "Connection Test Successful",
        description: `${gatewayId.replace('_', ' ').toUpperCase()} is responding normally.`,
      });
    } catch (error) {
      setGateways(prev => prev.map(g => 
        g.id === gatewayId 
          ? { ...g, status: 'error', errorCount: g.errorCount + 1 }
          : g
      ));

      toast({
        title: "Connection Test Failed",
        description: `Unable to connect to ${gatewayId.replace('_', ' ').toUpperCase()}.`,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const switchToGateway = (gateway: PaymentGateway) => {
    if (gateway.status === 'online') {
      setActiveGateway(gateway);
      onGatewayChange?.(gateway);
      
      toast({
        title: "Gateway Switched",
        description: `Now using ${gateway.name} for payment processing.`,
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-muted-foreground" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (gateway: PaymentGateway) => {
    const variant = gateway.status === 'online' ? 'default' : 
                   gateway.status === 'error' ? 'destructive' : 'secondary';
    
    return (
      <Badge variant={variant} className="ml-2">
        {gateway.status.toUpperCase()}
      </Badge>
    );
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 150) return 'text-success';
    if (responseTime < 300) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Payment Gateway Status
          {activeGateway && (
            <Badge variant="outline" className="ml-2">
              Active: {activeGateway.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              className={`p-4 border rounded-lg transition-all ${
                activeGateway?.id === gateway.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(gateway.status)}
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{gateway.name}</span>
                      {getStatusBadge(gateway)}
                      {activeGateway?.id === gateway.id && (
                        <Badge variant="default" className="ml-2">ACTIVE</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="capitalize">{gateway.type} Gateway</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className={getResponseTimeColor(gateway.lastResponse!)}>
                          {gateway.lastResponse}ms
                        </span>
                      </span>
                      {gateway.errorCount > 0 && (
                        <span className="text-destructive">
                          {gateway.errorCount} errors
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testGatewayConnection(gateway.id)}
                    disabled={isTestingConnection}
                  >
                    {isTestingConnection ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {gateway.status === 'online' && activeGateway?.id !== gateway.id && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => switchToGateway(gateway)}
                    >
                      Use This Gateway
                    </Button>
                  )}
                </div>
              </div>

              {/* Detailed status information */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Priority:</span>
                    <span className="ml-2 font-medium">#{gateway.priority}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Retries:</span>
                    <span className="ml-2 font-medium">{gateway.maxRetries}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Success Rate:</span>
                    <span className="ml-2 font-medium text-success">
                      {Math.max(0, 100 - (gateway.errorCount * 10))}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Failover Information */}
        <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
          <div className="flex items-center gap-2 text-info text-sm font-medium mb-1">
            <AlertTriangle className="h-4 w-4" />
            Automatic Failover Enabled
          </div>
          <p className="text-xs text-muted-foreground">
            If the primary gateway fails, the system will automatically switch to the next available gateway.
            Manual switching is available at any time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};