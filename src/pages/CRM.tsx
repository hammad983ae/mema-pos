import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CustomerList } from "@/components/crm/CustomerList";
import { CustomerProfile } from "@/components/crm/CustomerProfile";
import { CustomerForm } from "@/components/crm/CustomerForm";
import { CustomerFormDialog } from "@/components/shared/CustomerFormDialog";
import { ConversationsList } from "@/components/customer-service/ConversationsList";
import { CustomerServiceChat } from "@/components/customer-service/CustomerServiceChat";
import { NewConversationDialog } from "@/components/customer-service/NewConversationDialog";
import ShippingRequestForm from "@/components/shipping/ShippingRequestForm";
import ShippingRequestsList from "@/components/shipping/ShippingRequestsList";
import { PosAuthDialog } from "@/components/auth/PosAuthDialog";
import { Users, MessageSquare, Bot, Package, Plus } from "lucide-react";

type ViewState = "list" | "profile" | "form";

interface CRMProps {
  onNavigateBack?: () => void; // Optional callback for when CRM needs to go back
}

const CRM = ({ onNavigateBack }: CRMProps = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewState>("list");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("customers");
  const [shippingTab, setShippingTab] = useState("requests");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");
  const [showAuthDialog, setShowAuthDialog] = useState(true); // Show auth dialog by default
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track if user is authenticated for CRM access

  useEffect(() => {
    const getBusinessContext = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("user_business_memberships")
          .select("business_id, role")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (data) {
          setBusinessId(data.business_id);
        }
      } catch (error) {
        console.error("Error fetching business context:", error);
      }
    };

    getBusinessContext();
  }, [user]);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentView("profile");
  };

  const handleEditCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentView("form");
  };

  const handleAddCustomer = () => {
    setSelectedCustomerId(null);
    setCurrentView("form");
  };

  const handleQuickAddCustomer = () => {
    setShowQuickAddDialog(true);
  };

  const handleQuickCustomerCreated = () => {
    setShowQuickAddDialog(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSaveCustomer = () => {
    setCurrentView("list");
    setSelectedCustomerId(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCancelForm = () => {
    setCurrentView("list");
    setSelectedCustomerId(null);
  };

  const handleCloseProfile = () => {
    setCurrentView("list");
    setSelectedCustomerId(null);
  };

  const handleEditFromProfile = () => {
    setCurrentView("form");
  };

  // Customer Service handlers
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
  };

  const handleNewConversationSuccess = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowNewConversation(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthDialog(false);
  };

  // Show loading state while waiting for authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">CRM Access Required</h2>
          <p className="text-muted-foreground mb-4">
            Please authenticate to access Customer Relationship Management
          </p>
        </div>
        <PosAuthDialog
          isOpen={showAuthDialog}
          onClose={() => {
            // Use callback if provided (embedded mode), otherwise navigate (standalone mode)
            if (onNavigateBack) {
              onNavigateBack();
            } else {
              navigate("/pos");
            }
          }}
          onSuccess={handleAuthSuccess}
          title="CRM Access Required"
          description="Please enter your credentials to access Customer Relationship Management"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Relationship Management
          </h1>
          <p className="text-muted-foreground">
            Manage customers and provide intelligent customer service support
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Management
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Customer Service
              <Bot className="h-3 w-3 text-blue-500" />
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Shipping
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-6">
            {currentView === "list" && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Customer Management</h2>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddCustomer} size="sm">
                      Add Customer (Full Form)
                    </Button>
                    <Button
                      onClick={handleQuickAddCustomer}
                      variant="outline"
                      size="sm"
                    >
                      Quick Add Customer
                    </Button>
                  </div>
                </div>

                <CustomerList
                  onSelectCustomer={handleSelectCustomer}
                  onEditCustomer={handleEditCustomer}
                  onAddCustomer={handleAddCustomer}
                  refreshTrigger={refreshTrigger}
                />
              </>
            )}

            {currentView === "profile" && selectedCustomerId && (
              <CustomerProfile
                customerId={selectedCustomerId}
                onEdit={handleEditFromProfile}
                onClose={handleCloseProfile}
              />
            )}

            {currentView === "form" && (
              <CustomerForm
                customerId={selectedCustomerId}
                onSave={handleSaveCustomer}
                onCancel={handleCancelForm}
              />
            )}
          </TabsContent>

          <TabsContent value="service" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2">
                <ConversationsList
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversationId}
                  onNewConversation={handleNewConversation}
                />
              </div>

              <div className="lg:col-span-3">
                <CustomerServiceChat
                  conversationId={selectedConversationId}
                  onClose={() => setSelectedConversationId(undefined)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-6">
            <Tabs
              value={shippingTab}
              onValueChange={setShippingTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="requests"
                  className="flex items-center gap-2"
                >
                  Shipping Requests
                </TabsTrigger>
                <TabsTrigger value="create" className="flex items-center gap-2">
                  Create Request
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests" className="space-y-6">
                <ShippingRequestsList
                  onCreateRequest={() => setShippingTab("create")}
                />
              </TabsContent>

              <TabsContent value="create" className="space-y-6">
                <ShippingRequestForm />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <NewConversationDialog
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          onSuccess={handleNewConversationSuccess}
        />

        <CustomerFormDialog
          isOpen={showQuickAddDialog}
          onClose={() => setShowQuickAddDialog(false)}
          onCustomerCreated={handleQuickCustomerCreated}
          simplified={true}
        />
      </div>
    </div>
  );
};

export default CRM;
