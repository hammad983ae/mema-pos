import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Calculator,
  DollarSign,
  Trash2,
  Receipt,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const POSDemo = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInput, setCustomerInput] = useState("");

  const products = [
    { id: "1", name: "Facial Treatment", price: 150.00, category: "Services" },
    { id: "2", name: "Moisturizer Pro", price: 45.99, category: "Products" },
    { id: "3", name: "Serum Vitamin C", price: 32.50, category: "Products" },
    { id: "4", name: "Eye Cream", price: 28.99, category: "Products" },
    { id: "5", name: "Cleansing Oil", price: 22.50, category: "Products" },
    { id: "6", name: "Chemical Peel", price: 200.00, category: "Services" },
    { id: "7", name: "Microdermabrasion", price: 120.00, category: "Services" },
    { id: "8", name: "Sunscreen SPF 50", price: 18.99, category: "Products" },
  ];

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  const processPayment = () => {
    alert("Demo: Payment processed successfully!");
    setCart([]);
    setCustomerInput("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">MemaPOS Demo</h1>
              <Badge variant="outline">Demo Mode</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Store: Beauty Spa • Terminal: POS-001
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Products & Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {products.map((product) => (
                    <Button
                      key={product.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => addToCart(product)}
                    >
                      <div className="w-full">
                        <div className="font-medium text-left">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                        <div className="text-lg font-bold text-primary">${product.price.toFixed(2)}</div>
                      </div>
                      <Plus className="h-4 w-4 ml-auto" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Current Sale
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Input */}
                <div>
                  <Input
                    placeholder="Customer name/phone (optional)"
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                  />
                </div>

                <Separator />

                {/* Cart Items */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No items in cart
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Buttons */}
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    disabled={cart.length === 0}
                    onClick={processPayment}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={cart.length === 0}
                    onClick={processPayment}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Cash Payment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setCart([])}
                    disabled={cart.length === 0}
                  >
                    Clear Cart
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">$1,247</div>
                    <div className="text-sm text-muted-foreground">Today's Sales</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">23</div>
                    <div className="text-sm text-muted-foreground">Transactions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSDemo;