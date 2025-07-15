import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  User, 
  Delete, 
  AlertCircle,
  Clock,
  Store,
  ArrowLeft,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkPinRateLimit, logPinAttempt, verifyPin } from "@/lib/security";

const POSLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [storeCode, setStoreCode] = useState("");
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"store" | "employee">("store");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load employees for the selected store
  const loadEmployees = async (businessId: string) => {
    try {
      // Get all employees for this business
      const { data, error } = await supabase
        .from('user_business_memberships')
        .select(`
          user_id,
          profiles!inner(
            user_id,
            full_name,
            username,
            pos_pin
          )
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .not('profiles.username', 'is', null)
        .not('profiles.pos_pin', 'is', null);

      if (error) throw error;
      
      const employeeData = data?.map(item => item.profiles).filter(Boolean) || [];
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleStoreCodeInput = (digit: string) => {
    if (storeCode.length < 6) {
      setStoreCode(prev => prev + digit);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
    }
  };

  const handleClear = () => {
    if (step === "store") {
      setStoreCode("");
    } else {
      setPin("");
    }
    setError("");
  };

  const handleBackspace = () => {
    if (step === "store") {
      setStoreCode(prev => prev.slice(0, -1));
    } else {
      setPin(prev => prev.slice(0, -1));
    }
    setError("");
  };

  const handleStoreLogin = async () => {
    if (storeCode.length !== 6) {
      setError("Please enter a 6-digit store code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify store code
      const { data: store, error } = await supabase
        .from('stores')
        .select('*, businesses(name)')
        .eq('pos_access_code', storeCode.toUpperCase())
        .eq('status', 'active')
        .single();

      if (error || !store) {
        setError("Invalid store code. Please check with your manager.");
        setStoreCode("");
        return;
      }

      setSelectedStore(store);
      await loadEmployees(store.business_id);
      setStep("employee");
      
      toast({
        title: `Connected to ${store.name}`,
        description: `${store.businesses.name} - Please login with your credentials`,
      });

    } catch (error: any) {
      console.error('Store login error:', error);
      setError("Store verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeLogin = async () => {
    if (!username.trim() || !pin.trim()) {
      setError("Please enter both username and PIN");
      return;
    }
    if (pin.length !== 6) {
      setError("PIN must be 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check rate limiting first
      const rateLimitOk = await checkPinRateLimit(username);
      if (!rateLimitOk) {
        setError("Account locked due to too many failed attempts. Try again in 1 hour.");
        setPin("");
        return;
      }

      // Get profile first to check if PIN exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (profileError || !profile) {
        await logPinAttempt(profile?.user_id || username, false);
        setError("Invalid username or PIN. Please try again.");
        setPin("");
        return;
      }

      // Verify PIN (stored as plain text)
      if (!profile.pos_pin) {
        await logPinAttempt(profile.user_id, false);
        setError("No PIN set for this user. Contact your manager.");
        setPin("");
        return;
      }

      // Direct PIN comparison (since it's stored as plain text)
      if (pin !== profile.pos_pin) {
        await logPinAttempt(profile.user_id, false);
        setError("Invalid username or PIN. Please try again.");
        setPin("");
        return;
      }

      // Verify employee belongs to this business
      const { data: membership } = await supabase
        .from('user_business_memberships')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('business_id', selectedStore.business_id)
        .eq('is_active', true)
        .single();

      if (!membership) {
        await logPinAttempt(profile.user_id, false);
        setError("You don't have access to this store location.");
        return;
      }

      // Log successful PIN attempt
      await logPinAttempt(profile.user_id, true);

      // Get or create store day session
      const { data: daySessionData, error: sessionError } = await supabase
        .rpc('get_or_create_store_day_session', {
          p_store_id: selectedStore.id,
          p_opened_by: profile.user_id,
          p_opening_cash_amount: 0.00
        });

      if (sessionError) {
        console.error('Day session error:', sessionError);
        setError("Failed to access store session. Please try again.");
        return;
      }

      const daySession = daySessionData[0];

      // Store POS session with day session info
      localStorage.setItem('pos_session', JSON.stringify({
        store: selectedStore,
        daySession: {
          id: daySession.session_id,
          sessionDate: daySession.session_date,
          openedAt: daySession.opened_at,
          openedByName: daySession.opened_by_name,
          isNewSession: daySession.is_new_session
        },
        user: {
          id: profile.user_id,
          name: profile.full_name,
          username: profile.username,
          role: membership.role
        },
        loginAt: new Date().toISOString()
      }));

      // Automatically clock in the employee
      await supabase
        .from('employee_clock_status')
        .insert({
          user_id: profile.user_id,
          store_id: selectedStore.id,
          business_id: selectedStore.business_id,
          clocked_in_at: new Date().toISOString(),
          is_active: true
        });

      const welcomeMessage = daySession.is_new_session 
        ? `Store opened by ${profile.full_name || profile.username}` 
        : `Welcome back! Store opened earlier by ${daySession.opened_by_name}`;

      toast({
        title: welcomeMessage,
        description: `${selectedStore.name} - ${daySession.session_date}`,
      });

      navigate('/pos');

    } catch (error: any) {
      console.error('Employee login error:', error);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (employeeData: any) => {
    setUsername(employeeData.username);
    setPin("");
    setError("");
    toast({
      title: "Enter PIN",
      description: `Please enter PIN for ${employeeData.username}`,
    });
  };

  const goBack = () => {
    setStep("store");
    setSelectedStore(null);
    setEmployees([]);
    setUsername("");
    setPin("");
    setError("");
  };

  // Auto-submit when codes are complete
  useEffect(() => {
    if (step === "store" && storeCode.length === 6) {
      handleStoreLogin();
    }
  }, [storeCode, step]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">MemaPOS</span>
          </div>
          
          {/* Time Display */}
          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-2 text-2xl font-mono font-bold">
              <Clock className="h-5 w-5" />
              <span>{formatTime(currentTime)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(currentTime)}
            </p>
          </div>
        </div>

        {/* Store Selection Step */}
        {step === "store" && (
          <Card className="bg-card shadow-elegant border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl flex items-center justify-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Store Location</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Store Code Display */}
              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Enter your 6-digit store code</p>
                  <div className="flex justify-center space-x-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div
                        key={index}
                        className="w-12 h-12 border-2 border-border rounded-lg flex items-center justify-center text-xl font-bold font-mono"
                      >
                        {storeCode[index] || ""}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    className="h-12 text-lg font-semibold"
                    onClick={() => handleStoreCodeInput(num.toString())}
                    disabled={loading}
                  >
                    {num}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => handleStoreCodeInput("0")}
                  disabled={loading}
                >
                  0
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={handleBackspace}
                  disabled={loading}
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </div>

              {/* Instructions */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>• Enter the 6-digit store code provided by your manager</p>
                <p>• This code is unique to your store location</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employee Login Step */}
        {step === "employee" && selectedStore && (
          <Card className="bg-card shadow-elegant border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-center text-xl flex items-center justify-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>{selectedStore.name}</span>
                </CardTitle>
                <div className="w-8" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {selectedStore.businesses.name}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert className="border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Username Input */}
              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Enter your username</p>
                  <Input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="text-center text-lg"
                  />
                </div>
              </div>

              {/* PIN Display */}
              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Enter your PIN</p>
                   <div className="flex justify-center space-x-2">
                     {[0, 1, 2, 3, 4, 5].map((index) => (
                       <div
                         key={index}
                         className="w-12 h-12 border-2 border-border rounded-lg flex items-center justify-center text-xl font-bold"
                       >
                         {pin[index] ? "●" : ""}
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    className="h-12 text-lg font-semibold"
                    onClick={() => handlePinInput(num.toString())}
                    disabled={loading}
                  >
                    {num}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={handleEmployeeLogin}
                  disabled={loading || !username.trim() || pin.length !== 6}
                >
                  Login
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 text-lg font-semibold"
                  onClick={() => handlePinInput("0")}
                  disabled={loading}
                >
                  0
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={handleBackspace}
                  disabled={loading}
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Employee Selection */}
              {employees.length > 0 && (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Quick Select Employee</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {employees.map((emp) => (
                      <Button
                        key={emp.user_id}
                        variant="ghost"
                        className="h-auto p-3 flex flex-col items-center space-y-1"
                        onClick={() => quickLogin(emp)}
                        disabled={loading}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-xs text-center font-medium">{emp.username}</span>
                        <span className="text-xs text-center text-muted-foreground">{emp.full_name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Ready
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>• Enter your username and 6-digit PIN</p>
                <p>• Use quick select for faster login</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default POSLogin;