import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { CartSidebar } from "@/components/pos/CartSidebar";

import { CategoryTabs } from "@/components/pos/CategoryTabs";
import { ReceiptManagement } from "@/components/pos/ReceiptManagement";
import { CashDrawerManager } from "@/components/pos/CashDrawerManager";
import { CloseDayManager } from "@/components/pos/CloseDayManager";
import { RealtimeInventory } from "@/components/pos/RealtimeInventory";
import { AdvancedReporting } from "@/components/pos/AdvancedReporting";
import { HardwareIntegration } from "@/components/pos/HardwareIntegration";
import { BarcodeScanner } from "@/components/pos/BarcodeScanner";
import { BulkBarcodePrinter } from "@/components/pos/BulkBarcodePrinter";
import ClockInManager from "@/components/pos/ClockInManager";
import { OfflineManager } from "@/components/pos/OfflineManager";
import CRM from "@/pages/CRM";
import { EmployeeAuth } from "@/components/pos/EmployeeAuth";
import { EmployeeDashboard } from "@/components/pos/EmployeeDashboard";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Scan,
  ShoppingCart,
  LogOut,
  Receipt,
  Users,
  Package,
  Settings,
  FileText,
  DollarSign,
  Calendar,
  Monitor,
  BarChart3,
  Wrench,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  minimum_price?: number;
  quantity: number;
  category: string;
  image?: string;
  shipping_required?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  minimum_price?: number;
  category: string;
  image?: string;
  description?: string;
  inStock: boolean;
  sku: string;
}

interface Employee {
  id: string;
  username: string;
  full_name: string;
  position_type: string;
  business_id: string;
}

const POS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [posUser, setPosUser] = useState<any>(null);
  const [activeView, setActiveView] = useState("sale");
  const [tipAmount, setTipAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Employee authentication state
  const [authenticatedEmployee, setAuthenticatedEmployee] =
    useState<Employee | null>(null);
  const [showEmployeeAuth, setShowEmployeeAuth] = useState(false);

  // Update customer display whenever cart changes
  const updateCustomerDisplay = () => {
    const displayData = {
      items: cartItems,
      subtotal: getTotalPrice(),
      tax: getTotalPrice() * 0.16,
      tipAmount,
      discountAmount,
      total:
        getTotalPrice() + getTotalPrice() * 0.16 + tipAmount - discountAmount,
      storeName: posUser?.store?.name || "MemaPOS Store",
    };

    localStorage.setItem("customer_display_data", JSON.stringify(displayData));
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent("customer-display-update"));
  };

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem("pos_cart");
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        if (cartData.items && Array.isArray(cartData.items)) {
          setCartItems(cartData.items);
          setTipAmount(cartData.tip || 0);
          setDiscountAmount(cartData.discount || 0);
        }
      } catch (error) {
        console.error("Error loading saved cart:", error);
      }
    }
  }, []);

  // Check for POS authentication and day session
  useEffect(() => {
    const checkPOSAccess = async () => {
      const sessionData = localStorage.getItem("pos_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);

        // Check if we have a day session
        if (session.daySession) {
          // Verify the day session is still active
          try {
            const { data: daySession } = await supabase
              .from("store_day_sessions")
              .select("*")
              .eq("id", session.daySession.id)
              .eq("is_active", true)
              .maybeSingle();

            if (daySession) {
              setPosUser(session);
              return;
            } else {
              // Day session is closed, clear localStorage and redirect
              localStorage.removeItem("pos_session");
            }
          } catch (error) {
            console.error("Error checking day session:", error);
            localStorage.removeItem("pos_session");
          }
        } else if (session.openedBy) {
          // Legacy session format, convert to new format if user is authorized
          setPosUser(session);
          return;
        }
      }

      // Check if user is owner/manager and can auto-access POS
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          navigate("/pos/login");
          return;
        }

        // Get user's business membership
        const { data: membership } = await supabase
          .from("user_business_memberships")
          .select(
            `
            role,
            business_id,
            businesses!inner(
              id,
              name,
              stores!inner(
                id,
                name,
                status
              )
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (
          !membership ||
          !["owner", "manager", "office"].includes(membership.role)
        ) {
          navigate("/pos/login");
          return;
        }

        // Find an active store
        const activeStore = membership.businesses.stores.find(
          (store) => store.status === "active",
        );
        if (!activeStore) {
          navigate("/pos/login");
          return;
        }

        // Get or create day session for authorized user
        const { data: daySessionData, error: sessionError } =
          await supabase.rpc("get_or_create_store_day_session", {
            p_store_id: activeStore.id,
            p_opened_by: user.id,
            p_opening_cash_amount: 0.0,
          });

        if (sessionError) {
          console.error("Day session error:", sessionError);
          navigate("/pos/login");
          return;
        }

        const daySession = daySessionData[0];

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // Create automatic POS session for authorized user
        const autoSession = {
          store: {
            id: activeStore.id,
            name: activeStore.name,
            business_id: membership.business_id,
          },
          daySession: {
            id: daySession.session_id,
            sessionDate: daySession.session_date,
            openedAt: daySession.opened_at,
            openedByName: daySession.opened_by_name,
            isNewSession: daySession.is_new_session,
          },
          user: {
            id: user.id,
            name: profile?.full_name || profile?.username || user.email,
            username: profile?.username || user.email,
            role: membership.role,
          },
          loginAt: new Date().toISOString(),
        };

        localStorage.setItem("pos_session", JSON.stringify(autoSession));
        setPosUser(autoSession);
      } catch (error) {
        console.error("Error checking POS access:", error);
        navigate("/pos/login");
      }
    };

    checkPOSAccess();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("pos_session");
    navigate("/pos/login");
  };

  if (!posUser) {
    return <div>Loading...</div>;
  }

  const addToCart = (product: Product, customPrice?: number) => {
    const finalPrice = customPrice || product.price;

    setCartItems((prev) => {
      const existingItem = prev.find(
        (item) => item.id === product.id && item.price === finalPrice,
      );
      let newItems;
      if (existingItem) {
        newItems = prev.map((item) =>
          item.id === product.id && item.price === finalPrice
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        newItems = [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: finalPrice,
            minimum_price: product.minimum_price,
            quantity: 1,
            category: product.category,
            shipping_required: false,
          },
        ];
      }

      // Update customer display after state change
      setTimeout(updateCustomerDisplay, 0);
      return newItems;
    });
  };

  const updateCartItem = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => {
        const newItems = prev.filter((item) => item.id !== id);
        setTimeout(updateCustomerDisplay, 0);
        return newItems;
      });
    } else {
      setCartItems((prev) => {
        const newItems = prev.map((item) =>
          item.id === id ? { ...item, quantity } : item,
        );
        setTimeout(updateCustomerDisplay, 0);
        return newItems;
      });
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      setTimeout(updateCustomerDisplay, 0);
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setTimeout(updateCustomerDisplay, 0);
  };

  const updateCartItemShipping = (id: string, shipping_required: boolean) => {
    setCartItems((prev) => {
      const newItems = prev.map((item) =>
        item.id === id ? { ...item, shipping_required } : item,
      );
      setTimeout(updateCustomerDisplay, 0);
      return newItems;
    });
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Store cart data for checkout flow
    const cartData = {
      items: cartItems,
      total: grandTotal,
      subtotal: subtotal,
      tax: taxAmount,
      tip: tipAmount,
      discount: discountAmount,
    };
    localStorage.setItem("pos_cart", JSON.stringify(cartData));

    // Navigate to multi-step checkout
    navigate("/checkout/customer");
  };

  const subtotal = getTotalPrice();
  const taxAmount = subtotal * 0.16; // 16% tax like in the Master POS
  const grandTotal = subtotal + taxAmount + tipAmount - discountAmount;

  const navItems = [
    { id: "sale", label: "SALE", icon: ShoppingCart, color: "text-primary" },
    {
      id: "receipts",
      label: "RECEIPTS",
      icon: Receipt,
      color: "text-blue-600",
    },
    { id: "mydash", label: "MY DASH", icon: Monitor, color: "text-purple-600" },
    {
      id: "clockin",
      label: "CLOCK IN",
      icon: Calendar,
      color: "text-green-600",
    },
    {
      id: "customers",
      label: "CUSTOMERS",
      icon: Users,
      color: "text-orange-600",
    },
    {
      id: "inventory",
      label: "INVENTORY",
      icon: Package,
      color: "text-red-600",
    },
    {
      id: "settings",
      label: "SETTINGS",
      icon: Settings,
      color: "text-blue-600",
    },
    {
      id: "reports",
      label: "X-REPORT",
      icon: FileText,
      color: "text-gray-600",
    },
    {
      id: "cash",
      label: "CASH MANAGER",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      id: "closeday",
      label: "CLOSE DAY",
      icon: Calendar,
      color: "text-red-600",
    },
    {
      id: "employees",
      label: "EMPLOYEES",
      icon: Users,
      color: "text-gray-600",
    },
    {
      id: "display",
      label: "CUSTOMER DISPLAY",
      icon: ExternalLink,
      color: "text-blue-600",
    },
  ];

  const openCustomerDisplay = () => {
    const displayUrl = `/pos/display?store=${encodeURIComponent(posUser?.store?.name || "MemaPOS Store")}`;
    window.open(
      displayUrl,
      "_blank",
      "width=800,height=900,resizable=yes,scrollbars=yes",
    );
  };

  const renderMainContent = () => {
    switch (activeView) {
      case "sale":
        return (
          <div className="flex-1 flex flex-col bg-muted/20">
            {/* Modern Search and Controls with Green Theme */}
            <div className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search products, SKU, or scan barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-base bg-background border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        // Quick SKU lookup on Enter
                        const product = products.find(
                          (p) =>
                            p.sku.toLowerCase() === searchQuery.toLowerCase() ||
                            p.name
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                        );
                        if (product) {
                          addToCart(product, product.price); // Use retail price for quick add
                          setSearchQuery("");
                        }
                      }
                    }}
                  />
                </div>
                <BarcodeScanner
                  onProductFound={(product) =>
                    addToCart(product, product.price)
                  }
                  onSKULookup={(sku) => setSearchQuery(sku)}
                />
                <BulkBarcodePrinter />
              </div>
            </div>

            {/* Category Tabs */}
            <CategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {/* Product Grid */}
            <div className="flex-1 overflow-auto">
              <ProductGrid
                searchQuery={searchQuery}
                activeCategory={activeCategory}
                onAddToCart={addToCart}
              />
            </div>
          </div>
        );
      case "receipts":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <ReceiptManagement />
          </div>
        );
      case "cash":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <CashDrawerManager storeId={posUser?.store?.id} />
          </div>
        );
      case "closeday":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <CloseDayManager
              storeId={posUser?.store?.id}
              onNavigateBack={() => setActiveView("sale")}
            />
          </div>
        );
      case "inventory":
        return (
          <div className="flex-1 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <BarChart3 className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="font-semibold mb-2">COUNT INVENTORY</h3>
                  <p className="text-sm text-muted-foreground">
                    Physical inventory count
                  </p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <Package className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <h3 className="font-semibold mb-2">MANUALLY ADD INVENTORY</h3>
                  <p className="text-sm text-muted-foreground">
                    Add items manually
                  </p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <Wrench className="h-12 w-12 mx-auto text-orange-600 mb-4" />
                  <h3 className="font-semibold mb-2">
                    RECEIVE TRANSFERS/GOODS
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Process incoming stock
                  </p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <Package className="h-12 w-12 mx-auto text-red-600 mb-4" />
                  <h3 className="font-semibold mb-2">LOSSES/DAMAGE</h3>
                  <p className="text-sm text-muted-foreground">
                    Report damaged items
                  </p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <Package className="h-12 w-12 mx-auto text-orange-600 mb-4" />
                  <h3 className="font-semibold mb-2">SEND MERCHANDISE</h3>
                  <p className="text-sm text-muted-foreground">
                    Transfer to other stores
                  </p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <Monitor className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="font-semibold mb-2">LIVE QUANTITY</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time stock levels
                  </p>
                </Card>
              </div>

              {/* Real-time Inventory Alerts */}
              <RealtimeInventory storeId={posUser?.store?.id} />
            </div>
          </div>
        );
      case "customers":
        return (
          <div className="flex-1 flex flex-col">
            <div className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView("sale")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to POS
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <CRM onNavigateBack={() => setActiveView("sale")} />
            </div>
          </div>
        );
      case "employees":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <ClockInManager
                storeId={posUser?.store?.id}
                businessId={posUser?.store?.business_id}
                currentEmployeeId={posUser?.openedBy?.id}
              />
            </div>
          </div>
        );
      case "reports":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <AdvancedReporting storeId={posUser?.store?.id} />
          </div>
        );
      case "mydash":
        // Show employee dashboard if authenticated, otherwise this shouldn't render
        if (authenticatedEmployee) {
          return (
            <EmployeeDashboard
              employee={authenticatedEmployee}
              onSignOut={() => {
                setAuthenticatedEmployee(null);
                setActiveView("sale");
                toast({
                  title: "Signed out",
                  description:
                    "You have been signed out of your employee dashboard.",
                });
              }}
            />
          );
        } else {
          // This case should not happen as we handle auth in the navigation
          return (
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Access Required
                </h2>
                <p className="text-muted-foreground mb-6">
                  Please sign in to view your dashboard
                </p>
                <Button onClick={() => setShowEmployeeAuth(true)}>
                  Sign In
                </Button>
              </div>
            </div>
          );
        }
      case "clockin":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Clock In/Out
                </h2>
                <p className="text-muted-foreground">
                  Simple daily attendance tracking
                </p>
              </div>
              <Card className="p-8">
                <div className="text-center space-y-6">
                  <div className="text-6xl font-bold text-muted-foreground">
                    {new Date().toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-xl text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="space-y-4">
                    <Button size="lg" className="w-full text-lg py-6">
                      <Calendar className="h-6 w-6 mr-3" />
                      Clock In for Today
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Click to record your arrival for today's shift
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex-1 p-6 overflow-auto">
            <HardwareIntegration storeId={posUser?.store?.id} />
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {navItems.find((item) => item.id === activeView)?.label}
              </h3>
              <p className="text-muted-foreground">Feature coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card/30 to-muted/50">
      {/* Modern Header with Green Theme */}
      <div className="h-14 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <Monitor className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-lg font-semibold text-primary-foreground">
                MemaPOS
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
            >
              Store Open
            </Badge>
            <Badge
              variant="outline"
              className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
            >
              {posUser?.store?.name}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-primary-foreground/80 font-mono">
              {new Date().toLocaleDateString()} •{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Responsive Navigation Sidebar */}
        <div className="w-80 lg:w-96 xl:w-[420px] 2xl:w-[480px] bg-white dark:bg-card border-r border-border/50 shadow-2xl overflow-y-auto">
          <div className="p-6 lg:p-8 xl:p-10 space-y-8 lg:space-y-10">
            {/* Main Actions */}
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-foreground mb-6 lg:mb-8 tracking-wide">
                MAIN ACTIONS
              </h3>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {navItems.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "display") {
                        openCustomerDisplay();
                      } else if (item.id === "mydash") {
                        // Show employee auth if not authenticated, otherwise show dashboard
                        if (!authenticatedEmployee) {
                          setShowEmployeeAuth(true);
                        } else {
                          setActiveView("mydash");
                        }
                      } else {
                        setActiveView(item.id);
                      }
                    }}
                    className={`group relative flex flex-col items-center gap-2 lg:gap-3 p-4 lg:p-6 rounded-2xl font-semibold transition-all duration-300 min-h-[100px] lg:min-h-[120px] ${
                      activeView === item.id && item.id !== "display"
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25 transform scale-105"
                        : "bg-muted/30 text-foreground hover:bg-muted/50 hover:shadow-lg hover:transform hover:scale-105"
                    }`}
                  >
                    <item.icon className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0 transition-transform group-hover:scale-110" />
                    <span className="text-xs lg:text-sm text-center leading-tight font-bold tracking-wide">
                      {item.label}
                    </span>
                    {item.id === "display" && (
                      <ExternalLink className="absolute top-2 right-2 h-4 w-4 opacity-60" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Management Tools */}
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-foreground mb-6 lg:mb-8 tracking-wide">
                MANAGEMENT
              </h3>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {navItems.slice(4, 8).map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      item.id === "display"
                        ? openCustomerDisplay()
                        : setActiveView(item.id)
                    }
                    className={`group relative flex flex-col items-center gap-2 lg:gap-3 p-4 lg:p-6 rounded-2xl font-semibold transition-all duration-300 min-h-[100px] lg:min-h-[120px] ${
                      activeView === item.id && item.id !== "display"
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25 transform scale-105"
                        : "bg-muted/30 text-foreground hover:bg-muted/50 hover:shadow-lg hover:transform hover:scale-105"
                    }`}
                  >
                    <item.icon className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0 transition-transform group-hover:scale-110" />
                    <span className="text-xs lg:text-sm text-center leading-tight font-bold tracking-wide">
                      {item.label}
                    </span>
                    {item.id === "display" && (
                      <ExternalLink className="absolute top-2 right-2 h-4 w-4 opacity-60" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Operations */}
            <div>
              <h3 className="text-lg lg:text-xl font-bold text-foreground mb-6 lg:mb-8 tracking-wide">
                DAY OPERATIONS
              </h3>
              <div className="space-y-3 lg:space-y-4">
                {navItems.slice(8).map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      item.id === "display"
                        ? openCustomerDisplay()
                        : setActiveView(item.id)
                    }
                    className={`group w-full flex items-center gap-4 lg:gap-6 p-4 lg:p-6 rounded-2xl font-semibold transition-all duration-300 min-h-[70px] lg:min-h-[80px] ${
                      activeView === item.id && item.id !== "display"
                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/25"
                        : "bg-muted/30 text-foreground hover:bg-muted/50 hover:shadow-lg"
                    }`}
                  >
                    <item.icon className="h-6 w-6 lg:h-8 lg:w-8 flex-shrink-0 transition-transform group-hover:scale-110" />
                    <span className="flex-1 text-left text-sm lg:text-base font-bold tracking-wide">
                      {item.label}
                    </span>
                    {item.id === "display" && (
                      <ExternalLink className="h-5 w-5 opacity-60 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Store Info */}
            <div className="pt-6 border-t border-border/50">
              <div className="p-4 lg:p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground text-lg font-bold flex-shrink-0 shadow-lg">
                    {posUser?.store?.name?.charAt(0) || "S"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm lg:text-base font-bold text-foreground truncate">
                      {posUser?.store?.name || "Store Terminal"}
                    </div>
                    <div className="text-xs lg:text-sm text-muted-foreground truncate font-medium">
                      Active Session • Live
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {activeView === "customers" ? (
          renderMainContent()
        ) : (
          <div className="flex flex-1">
            {renderMainContent()}

            {/* Cart Sidebar with Shipping Options */}
            <div className="w-80 flex flex-col">
              <div className="flex-1">
                <CartSidebar
                  items={cartItems}
                  onUpdateItem={updateCartItem}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  onUpdateShipping={updateCartItemShipping}
                  totalPrice={getTotalPrice()}
                  businessId={posUser?.store?.business_id || ""}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  userRole={posUser?.role || "employee"}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Employee Authentication Modal */}
      <EmployeeAuth
        isOpen={showEmployeeAuth}
        onClose={() => setShowEmployeeAuth(false)}
        onEmployeeAuthenticated={(employee) => {
          setAuthenticatedEmployee(employee);
          setActiveView("mydash");
        }}
        businessId={posUser?.store?.business_id}
      />
    </div>
  );
};

export default POS;
