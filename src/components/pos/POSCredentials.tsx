import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Monitor, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface POSCredentialsProps {
  username?: string;
  currentPin?: string;
  canEdit?: boolean;
}

export const POSCredentials = ({ username, currentPin, canEdit = true }: POSCredentialsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [pinData, setPinData] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: ""
  });

  const handleUpdatePin = async () => {
    if (!pinData.newPin || pinData.newPin.length !== 6) {
      toast({
        title: "Error",
        description: "PIN must be exactly 6 digits for enhanced security",
        variant: "destructive",
      });
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      toast({
        title: "Error", 
        description: "PIN confirmation does not match",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{6}$/.test(pinData.newPin)) {
      toast({
        title: "Error",
        description: "PIN must contain only numbers",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('update-pos-pin', {
        body: {
          currentPin: pinData.currentPin || undefined,
          newPin: pinData.newPin
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Failed to update PIN");
      }

      toast({
        title: "Success",
        description: "POS PIN updated successfully",
      });

      // Clear form
      setPinData({
        currentPin: "",
        newPin: "",
        confirmPin: ""
      });
    } catch (error: any) {
      console.error('Error updating PIN:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="h-5 w-5" />
          <span>POS Login Credentials</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Credentials Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono">{username || "Not set"}</span>
              <Badge variant="secondary" className="text-xs">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Username cannot be changed after signup
            </p>
          </div>

          <div className="space-y-2">
            <Label>Current PIN Status</Label>
            <div className="flex items-center space-x-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <Badge variant={currentPin ? "default" : "destructive"}>
                {currentPin ? "Set" : "Not Set"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentPin ? "PIN is configured for POS access" : "PIN required for POS login"}
            </p>
          </div>
        </div>

        {canEdit && (
          <>
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Update POS PIN</h4>
              
              <div className="space-y-4">
                {currentPin && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPin">Current PIN</Label>
                    <div className="relative">
                      <Input
                        id="currentPin"
                        type={showCurrentPin ? "text" : "password"}
                        value={pinData.currentPin}
                        onChange={(e) => setPinData(prev => ({ ...prev, currentPin: e.target.value }))}
                        placeholder="Enter current PIN"
                        maxLength={6}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowCurrentPin(!showCurrentPin)}
                      >
                        {showCurrentPin ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPin">New PIN</Label>
                    <div className="relative">
                      <Input
                        id="newPin"
                        type={showNewPin ? "text" : "password"}
                        value={pinData.newPin}
                        onChange={(e) => setPinData(prev => ({ ...prev, newPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        placeholder="Enter 6-digit PIN"
                        maxLength={6}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowNewPin(!showNewPin)}
                      >
                        {showNewPin ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm PIN</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      value={pinData.confirmPin}
                      onChange={(e) => setPinData(prev => ({ ...prev, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="Confirm 6-digit PIN"
                      maxLength={6}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleUpdatePin} 
                  disabled={loading || !pinData.newPin || pinData.newPin.length !== 6}
                  className="w-full md:w-auto"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  {loading ? "Updating..." : "Update PIN"}
                </Button>
              </div>
            </div>
          </>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <h5 className="font-medium text-sm mb-2">POS Access Information</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use your username + PIN to login to POS terminals</li>
            <li>• PIN must be exactly 6 digits (numbers only)</li>
            <li>• PIN cannot be the same as another employee's PIN</li>
            <li>• Keep your PIN secure and don't share it with others</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};