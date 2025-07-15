import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorProvider } from "@/components/providers/ErrorProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";
import OnboardingFlow from "./pages/OnboardingFlow";
import Dashboard from "./pages/Dashboard";
import Shipping from "./pages/Shipping";
import Index from "./pages/Index";
import CustomerDisplay from "./pages/CustomerDisplay";
import POS from "./pages/POS";
import Analytics from "./pages/Analytics";
import Inventory from "./pages/Inventory";
import Team from "./pages/Team";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EODReport from "./pages/EODReport";
import BusinessSetup from "./pages/BusinessSetup";
import BusinessCreated from "./pages/BusinessCreated";
import POSLogin from "./pages/POSLogin";
import ManagerDashboard from "./pages/ManagerDashboard";
import Settings from "./pages/Settings";
import CRM from "./pages/CRM";
import TimeClock from "./pages/TimeClock";
import Appointments from "./pages/Appointments";
import Documents from "./pages/Documents";
import CustomerService from "./pages/CustomerService";
import MemaPOSSupportLegacy from "./pages/FieldixSupport";
import MemaPOSCustomerSupport from "./pages/MemaPOSCustomerSupport";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import WelcomeOwner from "./pages/WelcomeOwner";
import ChargebackDisputes from "./pages/ChargebackDisputes";
import SalesTraining from "./pages/SalesTraining";
import Payroll from "./pages/Payroll";
import { EmailSetupGuide } from "./pages/EmailSetupGuide";
import AISchedulingFeaturePage from "./pages/features/AISchedulingFeature";
import AIFeaturesPage from "./pages/features/AIFeatures";
import AnalyticsFeaturesPage from "./pages/features/AnalyticsFeature";
import InventoryFeaturesPage from "./pages/features/InventoryFeature";
import TeamFeature from "./pages/features/TeamFeature";
import POSFeature from "./pages/features/POSFeature";
import CRMFeature from "./pages/features/CRMFeature";
import SecurityFeature from "./pages/features/SecurityFeature";
import EmployeeInvitation from "./pages/EmployeeInvitation";
import AIAutomation from "./pages/AIAutomation";
import POSDemo from "./pages/POSDemo";
import CheckoutCustomer from "./pages/checkout/CheckoutCustomer";
import CheckoutPayment from "./pages/checkout/CheckoutPayment";
import CheckoutSalesTeam from "./pages/checkout/CheckoutSalesTeam";
import CheckoutComplete from "./pages/checkout/CheckoutComplete";
import AnalyticsDemo from "./pages/AnalyticsDemo";
import TeamDemo from "./pages/TeamDemo";
import Contact from "./pages/Contact";
import OfficeDashboard from "./pages/OfficeDashboard";
import StoreManagement from "./pages/StoreManagement";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorProvider>
        <RealtimeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthGuard requireAuth={false}><Auth /></AuthGuard>} />
            <Route path="/join" element={<AuthGuard requireAuth={false}><EmployeeInvitation /></AuthGuard>} />
            <Route path="/support" element={<AuthGuard requireAuth={false}><MemaPOSCustomerSupport /></AuthGuard>} />
            <Route path="/terms" element={<AuthGuard requireAuth={false}><TermsOfService /></AuthGuard>} />
            <Route path="/privacy" element={<AuthGuard requireAuth={false}><PrivacyPolicy /></AuthGuard>} />
            <Route path="/features/scheduling" element={<AuthGuard requireAuth={false}><AISchedulingFeaturePage /></AuthGuard>} />
            <Route path="/features/ai" element={<AuthGuard requireAuth={false}><AIFeaturesPage /></AuthGuard>} />
            <Route path="/features/analytics" element={<AuthGuard requireAuth={false}><AnalyticsFeaturesPage /></AuthGuard>} />
            <Route path="/features/inventory" element={<AuthGuard requireAuth={false}><InventoryFeaturesPage /></AuthGuard>} />
            <Route path="/features/team" element={<AuthGuard requireAuth={false}><TeamFeature /></AuthGuard>} />
            <Route path="/features/pos" element={<AuthGuard requireAuth={false}><POSFeature /></AuthGuard>} />
            <Route path="/features/crm" element={<AuthGuard requireAuth={false}><CRMFeature /></AuthGuard>} />
            <Route path="/features/security" element={<AuthGuard requireAuth={false}><SecurityFeature /></AuthGuard>} />
            
            {/* Onboarding routes - require auth but not business */}
            <Route path="/onboarding" element={<AuthGuard requireAuth={true} requireBusiness={false}><Onboarding /></AuthGuard>} />
            <Route path="/onboarding/flow" element={<AuthGuard requireAuth={true} requireBusiness={false}><OnboardingFlow /></AuthGuard>} />
            
            {/* Protected routes - require auth and business association */}
            <Route path="/dashboard" element={<AuthGuard requireAuth={true} requireBusiness={true}><Dashboard /></AuthGuard>} />
            <Route path="/" element={<AuthGuard requireAuth={false}><Index /></AuthGuard>} />
            <Route path="/welcome" element={<AuthGuard requireAuth={true} requireBusiness={true}><WelcomeOwner /></AuthGuard>} />
            <Route path="/pos/login" element={<AuthGuard requireAuth={true} requireBusiness={true}><POSLogin /></AuthGuard>} />
            <Route path="/pos/owner" element={<AuthGuard requireAuth={true} requireBusiness={true}><POS /></AuthGuard>} />
            <Route path="/pos" element={<AuthGuard requireAuth={true} requireBusiness={true}><POS /></AuthGuard>} />
            <Route path="/pos/demo" element={<AuthGuard requireAuth={false}><POSDemo /></AuthGuard>} />
            <Route path="/pos/display" element={<AuthGuard requireAuth={true} requireBusiness={true}><CustomerDisplay /></AuthGuard>} />
            
            {/* Checkout Flow Routes */}
            <Route path="/checkout/customer" element={<AuthGuard requireAuth={true} requireBusiness={true}><CheckoutCustomer /></AuthGuard>} />
            <Route path="/checkout/payment" element={<AuthGuard requireAuth={true} requireBusiness={true}><CheckoutPayment /></AuthGuard>} />
            <Route path="/checkout/sales-team" element={<AuthGuard requireAuth={true} requireBusiness={true}><CheckoutSalesTeam /></AuthGuard>} />
            <Route path="/checkout/complete" element={<AuthGuard requireAuth={true} requireBusiness={true}><CheckoutComplete /></AuthGuard>} />
            <Route path="/analytics" element={<AuthGuard requireAuth={true} requireBusiness={true}><Analytics /></AuthGuard>} />
            <Route path="/analytics/demo" element={<AuthGuard requireAuth={false}><AnalyticsDemo /></AuthGuard>} />
            <Route path="/inventory" element={<AuthGuard requireAuth={true} requireBusiness={true}><Inventory /></AuthGuard>} />
            <Route path="/team" element={<AuthGuard requireAuth={true} requireBusiness={true}><Team /></AuthGuard>} />
            <Route path="/team/demo" element={<AuthGuard requireAuth={false}><TeamDemo /></AuthGuard>} />
            <Route path="/employee" element={<AuthGuard requireAuth={true} requireBusiness={true}><EmployeeDashboard /></AuthGuard>} />
            <Route path="/employee/reports/submit" element={<AuthGuard requireAuth={true} requireBusiness={true}><EODReport /></AuthGuard>} />
            <Route path="/business/setup" element={<AuthGuard requireAuth={true} requireBusiness={true}><BusinessSetup /></AuthGuard>} />
            <Route path="/business/created" element={<AuthGuard requireAuth={true} requireBusiness={true}><BusinessCreated /></AuthGuard>} />
            <Route path="/manager" element={<AuthGuard requireAuth={true} requireBusiness={true}><ManagerDashboard /></AuthGuard>} />
            <Route path="/crm" element={<AuthGuard requireAuth={true} requireBusiness={true}><CRM /></AuthGuard>} />
            <Route path="/timeclock" element={<AuthGuard requireAuth={true} requireBusiness={true}><TimeClock /></AuthGuard>} />
            <Route path="/appointments" element={<AuthGuard requireAuth={true} requireBusiness={true}><Appointments /></AuthGuard>} />
            <Route path="/documents" element={<AuthGuard requireAuth={true} requireBusiness={true}><Documents /></AuthGuard>} />
            <Route path="/shipping" element={<AuthGuard requireAuth={true} requireBusiness={true}><Shipping /></AuthGuard>} />
            <Route path="/customer-service" element={<AuthGuard requireAuth={true} requireBusiness={true}><CustomerService /></AuthGuard>} />
            <Route path="/memapos-support" element={<AuthGuard requireAuth={true} requireBusiness={true}><MemaPOSCustomerSupport /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard requireAuth={true} requireBusiness={true}><Settings /></AuthGuard>} />
            <Route path="/payroll" element={<AuthGuard requireAuth={true} requireBusiness={true}><Payroll /></AuthGuard>} />
            <Route path="/email-setup" element={<AuthGuard requireAuth={true} requireBusiness={true}><EmailSetupGuide /></AuthGuard>} />
            <Route path="/sales-training" element={<AuthGuard requireAuth={true} requireBusiness={true}><SalesTraining /></AuthGuard>} />
            <Route path="/chargeback-disputes" element={<AuthGuard requireAuth={true} requireBusiness={true}><ChargebackDisputes /></AuthGuard>} />
            <Route path="/ai-automation" element={<AuthGuard requireAuth={true} requireBusiness={true}><AIAutomation /></AuthGuard>} />
            <Route path="/office" element={<AuthGuard requireAuth={true} requireBusiness={true}><OfficeDashboard /></AuthGuard>} />
            <Route path="/store-management" element={<AuthGuard requireAuth={true} requireBusiness={true}><StoreManagement /></AuthGuard>} />
            <Route path="/contact" element={<AuthGuard requireAuth={false}><Contact /></AuthGuard>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </RealtimeProvider>
      </ErrorProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
