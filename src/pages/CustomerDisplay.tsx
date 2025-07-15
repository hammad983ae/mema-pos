import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CustomerDisplay as CustomerDisplayComponent } from "@/components/pos/CustomerDisplay";
import { CartItem } from "@/pages/POS";

export default function CustomerDisplayPage() {
  const [searchParams] = useSearchParams();
  const [cartData, setCartData] = useState<{
    items: CartItem[];
    subtotal: number;
    tax: number;
    tipAmount: number;
    discountAmount: number;
    total: number;
    storeName: string;
  }>({
    items: [],
    subtotal: 0,
    tax: 0,
    tipAmount: 0,
    discountAmount: 0,
    total: 0,
    storeName: "Mema Store"
  });

  useEffect(() => {
    // Listen for real-time updates from the main POS
    const handleStorageChange = () => {
      const displayData = localStorage.getItem('customer_display_data');
      if (displayData) {
        try {
          const data = JSON.parse(displayData);
          setCartData(data);
        } catch (error) {
          console.error('Error parsing customer display data:', error);
        }
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the same window
    window.addEventListener('customer-display-update', handleStorageChange);

    // Initial load
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customer-display-update', handleStorageChange);
    };
  }, []);

  // Also check URL parameters for initial data
  useEffect(() => {
    const storeNameParam = searchParams.get('store');
    if (storeNameParam) {
      setCartData(prev => ({
        ...prev,
        storeName: decodeURIComponent(storeNameParam)
      }));
    }
  }, [searchParams]);

  return (
    <CustomerDisplayComponent
      items={cartData.items}
      subtotal={cartData.subtotal}
      tax={cartData.tax}
      tipAmount={cartData.tipAmount}
      discountAmount={cartData.discountAmount}
      total={cartData.total}
      storeName={cartData.storeName}
    />
  );
}