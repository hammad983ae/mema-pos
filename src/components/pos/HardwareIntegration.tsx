import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Printer, 
  Scan, 
  Wifi, 
  WifiOff, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";

interface HardwareDevice {
  id: string;
  name: string;
  type: 'printer' | 'scanner' | 'cash_drawer' | 'card_reader';
  status: 'connected' | 'disconnected' | 'error';
  lastSeen?: string;
}

interface HardwareIntegrationProps {
  storeId: string;
}

export const HardwareIntegration = ({ storeId }: HardwareIntegrationProps) => {
  const { toast } = useToast();
  const [devices] = useState<HardwareDevice[]>([
    {
      id: 'printer-001',
      name: 'Receipt Printer (Epson)',
      type: 'printer',
      status: 'connected',
      lastSeen: new Date().toISOString()
    },
    {
      id: 'scanner-001',
      name: 'Barcode Scanner',
      type: 'scanner',
      status: 'connected',
      lastSeen: new Date().toISOString()
    },
    {
      id: 'drawer-001',
      name: 'Cash Drawer',
      type: 'cash_drawer',
      status: 'connected',
      lastSeen: new Date().toISOString()
    },
    {
      id: 'reader-001',
      name: 'Card Reader (Square)',
      type: 'card_reader',
      status: 'disconnected'
    }
  ]);

  const [scanning, setScanning] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handlePrintTestReceipt = useCallback(async () => {
    setPrinting(true);
    try {
      // Simulate receipt printing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Test Receipt Printed",
        description: "Receipt printer is working correctly",
      });
    } catch (error) {
      toast({
        title: "Print Error",
        description: "Failed to print test receipt",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  }, [toast]);

  const handleOpenCashDrawer = useCallback(async () => {
    try {
      // Simulate cash drawer opening
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Cash Drawer Opened",
        description: "Drawer opened successfully",
      });
    } catch (error) {
      toast({
        title: "Drawer Error",
        description: "Failed to open cash drawer",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleScanBarcode = useCallback(async () => {
    setScanning(true);
    try {
      // Simulate barcode scanning
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate scanned barcode
      const mockBarcode = "1234567890123";
      
      toast({
        title: "Barcode Scanned",
        description: `Product code: ${mockBarcode}`,
      });
    } catch (error) {
      toast({
        title: "Scanner Error",
        description: "Failed to scan barcode",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  }, [toast]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'printer': return <Printer className="h-5 w-5" />;
      case 'scanner': return <Scan className="h-5 w-5" />;
      case 'cash_drawer': return <DollarSign className="h-5 w-5" />;
      case 'card_reader': return <Settings className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disconnected': return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'disconnected': return 'destructive';
      case 'error': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Hardware Integration
          </CardTitle>
          <CardDescription>
            Manage and test connected POS hardware devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Device Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {devices.map((device) => (
              <Card key={device.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getDeviceIcon(device.type)}
                    {getStatusIcon(device.status)}
                  </div>
                  <h4 className="font-medium text-sm mb-1">{device.name}</h4>
                  <Badge 
                    variant={getStatusColor(device.status) as any}
                    className="text-xs"
                  >
                    {device.status}
                  </Badge>
                  {device.lastSeen && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last seen: {new Date(device.lastSeen).toLocaleTimeString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hardware Tests */}
          <div className="space-y-4">
            <h4 className="font-semibold">Hardware Tests</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handlePrintTestReceipt}
                disabled={printing}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
              >
                <Printer className="h-6 w-6" />
                <span>{printing ? "Printing..." : "Test Receipt"}</span>
              </Button>

              <Button
                onClick={handleScanBarcode}
                disabled={scanning}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
              >
                <Scan className="h-6 w-6" />
                <span>{scanning ? "Scanning..." : "Test Scanner"}</span>
              </Button>

              <Button
                onClick={handleOpenCashDrawer}
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
              >
                <DollarSign className="h-6 w-6" />
                <span>Open Drawer</span>
              </Button>
            </div>
          </div>

          {/* Integration Status */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h5 className="font-medium mb-2">Integration Status</h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Printer Integration</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Barcode Scanner</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Cash Drawer</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Terminal</span>
                <Badge variant="destructive">Disconnected</Badge>
              </div>
            </div>
          </div>

          {/* Configuration Notes */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h5 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
              Hardware Configuration
            </h5>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p>• Receipt printers use ESC/POS protocol</p>
              <p>• Barcode scanners work with USB HID interface</p>
              <p>• Cash drawers connect via RJ11/RJ12 ports</p>
              <p>• Card readers integrate via SDK or API</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};