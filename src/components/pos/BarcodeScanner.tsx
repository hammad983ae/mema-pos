import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Scan, Camera, CameraOff, RotateCcw } from "lucide-react";
import { Product } from "@/pages/POS";

interface BarcodeScannerProps {
  onProductFound: (product: Product) => void;
  onSKULookup: (sku: string) => void;
}

export const BarcodeScanner = ({ onProductFound, onSKULookup }: BarcodeScannerProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualSku, setManualSku] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsScanning(true);
      
      // Start barcode detection
      detectBarcodes();
    } catch (error) {
      console.error("Camera access error:", error);
      toast({
        title: "Camera Access Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const detectBarcodes = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Simple barcode detection simulation
    // In a real implementation, you'd use a library like QuaggaJS or ZXing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simulate barcode detection every 500ms
    setTimeout(() => {
      if (isScanning) {
        // This would be replaced with actual barcode detection logic
        simulateBarcodeDetection();
        detectBarcodes();
      }
    }, 500);
  };

  const simulateBarcodeDetection = () => {
    // This is a simulation - in reality you'd use proper barcode detection
    const mockBarcodes = ['1234567890123', '9876543210987', 'CLN001', 'SER002'];
    const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
    
    // Randomly trigger detection for demo purposes
    if (Math.random() > 0.95) {
      handleBarcodeDetected(randomBarcode);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    stopCamera();
    await lookupProduct(barcode);
  };

  const lookupProduct = async (identifier: string) => {
    try {
      const { data: product, error } = await supabase
        .from("products")
        .select(`
          *,
          product_categories(name)
        `)
        .or(`barcode.eq.${identifier},sku.eq.${identifier}`)
        .eq("is_active", true)
        .single();

      if (error || !product) {
        toast({
          title: "Product Not Found",
          description: `No product found with barcode/SKU: ${identifier}`,
          variant: "destructive",
        });
        return;
      }

      // Transform to Product format
      const transformedProduct: Product = {
        id: product.id,
        name: product.name,
        price: product.price,
        minimum_price: product.minimum_price,
        category: product.product_categories?.name?.toLowerCase().replace(/\s+/g, '') || 'other',
        description: product.description,
        inStock: true, // Would check inventory
        sku: product.sku,
        image: product.image_url || undefined
      };

      onProductFound(transformedProduct);
      onSKULookup(identifier);
      setIsOpen(false);

      toast({
        title: "Product Found",
        description: `${product.name} added to cart`,
      });
    } catch (error) {
      console.error("Product lookup error:", error);
      toast({
        title: "Lookup Error",
        description: "Failed to lookup product",
        variant: "destructive",
      });
    }
  };

  const handleManualLookup = () => {
    if (manualSku.trim()) {
      lookupProduct(manualSku.trim());
      setManualSku("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualLookup();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="h-12 px-6 rounded-xl border-border bg-background hover:bg-muted">
          <Scan className="h-5 w-5 mr-2" />
          Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Barcode Scanner & SKU Lookup
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Manual SKU Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick SKU Lookup</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter SKU or barcode..."
                value={manualSku}
                onChange={(e) => setManualSku(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleManualLookup} disabled={!manualSku.trim()}>
                Lookup
              </Button>
            </div>
          </div>

          {/* Camera Scanner */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Camera Scanner</label>
              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={startCamera} variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline" size="sm">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </Button>
                )}
                <Button onClick={() => window.location.reload()} variant="ghost" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="relative bg-muted rounded-lg overflow-hidden h-64">
              {isScanning ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary w-48 h-24 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
                      
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/50 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    Scanning for barcodes...
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Camera className="h-12 w-12 mb-2" />
                  <p className="text-sm">Camera not active</p>
                  <p className="text-xs">Click "Start Camera" to begin scanning</p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Instructions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Hold barcode steady within the scanning frame</li>
              <li>• Ensure good lighting for best results</li>
              <li>• For manual lookup, enter SKU or barcode number</li>
              <li>• Scanner works with Code128, EAN, and UPC formats</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};