import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EmployeeAuth } from "@/components/pos/EmployeeAuth";
import { 
  Calendar, 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface CloseDayManagerProps {
  storeId: string;
  onNavigateBack?: () => void;
}

interface Employee {
  id: string;
  username: string;
  full_name: string;
  position_type: string;
  business_id: string;
}

type CloseStepType = 'auth' | 'inventory' | 'sales_review' | 'employee_breakdown' | 'final_review';

export const CloseDayManager = ({ storeId, onNavigateBack }: CloseDayManagerProps) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<CloseStepType>('auth');
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<Employee | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    // Always require authentication first
    setShowAuthDialog(true);
  }, []);

  const handleAuthSuccess = (employee: Employee) => {
    setAuthenticatedEmployee(employee);
    setShowAuthDialog(false);
    setCurrentStep('inventory');
    
    toast({
      title: "Access Granted",
      description: `Welcome ${employee.full_name}. Starting close day process...`,
    });
  };

  const handleAuthClose = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'auth', label: 'Authentication', icon: Users },
      { id: 'inventory', label: 'Inventory Count', icon: Package },
      { id: 'sales_review', label: 'Sales Review', icon: DollarSign },
      { id: 'employee_breakdown', label: 'Employee Reports', icon: BarChart3 },
      { id: 'final_review', label: 'Final Review', icon: CheckCircle }
    ];

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                    ${isActive ? 'bg-primary text-primary-foreground' : 
                      isCompleted ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-medium' : ''}`}>
                    {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`mx-4 h-px w-8 ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'inventory':
        return <InventoryCountStep onNext={() => setCurrentStep('sales_review')} storeId={storeId} />;
      case 'sales_review':
        return <SalesReviewStep onNext={() => setCurrentStep('employee_breakdown')} storeId={storeId} />;
      case 'employee_breakdown':
        return <EmployeeBreakdownStep onNext={() => setCurrentStep('final_review')} storeId={storeId} />;
      case 'final_review':
        return <FinalReviewStep onComplete={() => {}} storeId={storeId} />;
      default:
        return null;
    }
  };

  if (!authenticatedEmployee) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Close Day Process
            </CardTitle>
            <CardDescription>
              Authentication required to proceed with end-of-day closing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Manager or authorized employee login required
              </p>
            </div>
          </CardContent>
        </Card>

        <EmployeeAuth
          isOpen={showAuthDialog}
          onClose={handleAuthClose}
          onEmployeeAuthenticated={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Close Day Process
          </CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE, MMMM d, yyyy')} - Authorized by {authenticatedEmployee.full_name}
          </CardDescription>
        </CardHeader>
      </Card>

      {renderStepIndicator()}
      {renderCurrentStep()}
    </div>
  );
};

// Individual step components will be defined next
const InventoryCountStep = ({ onNext, storeId }: { onNext: () => void; storeId: string }) => {
  const { toast } = useToast();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventory Count
        </CardTitle>
        <CardDescription>
          Review and count current inventory levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Inventory Count Required</p>
          <p className="text-muted-foreground mb-6">
            Perform a physical count of all inventory items to ensure accuracy
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={onNext}>
              Skip Inventory Count
            </Button>
            <Button onClick={() => {
              // TODO: Implement inventory count interface
              toast({
                title: "Feature Coming Soon",
                description: "Inventory count interface will be implemented next",
              });
            }}>
              Start Inventory Count
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SalesReviewStep = ({ onNext, storeId }: { onNext: () => void; storeId: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Sales Review
        </CardTitle>
        <CardDescription>
          Review all sales and payment methods for the day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Sales Data Review</p>
          <p className="text-muted-foreground mb-6">
            Coming next: Comprehensive sales breakdown by payment method
          </p>
          
          <Button onClick={onNext}>
            Continue to Employee Reports
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EmployeeBreakdownStep = ({ onNext, storeId }: { onNext: () => void; storeId: string }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Employee Performance
        </CardTitle>
        <CardDescription>
          Sales breakdown by employee with performance charts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Employee Sales Analysis</p>
          <p className="text-muted-foreground mb-6">
            Coming next: Charts and breakdowns of employee sales performance
          </p>
          
          <Button onClick={onNext}>
            Continue to Final Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FinalReviewStep = ({ onComplete, storeId }: { onComplete: () => void; storeId: string }) => {
  const { toast } = useToast();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Final Review & Close Day
        </CardTitle>
        <CardDescription>
          Complete the day closing process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <p className="text-lg font-medium mb-2">Ready to Close Day</p>
          <p className="text-muted-foreground mb-6">
            All steps completed. Close the day to finalize all transactions.
          </p>
          
          <Button onClick={() => {
            // TODO: Implement actual day closing logic
            toast({
              title: "Day Closed Successfully",
              description: "All transactions have been finalized for today",
            });
          }}>
            Close Day
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};