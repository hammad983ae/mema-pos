import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Clock,
  Building,
  Loader2,
  Key,
  Copy,
  RefreshCw
} from "lucide-react";

interface Store {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string | null;
  status: string;
  tax_rate: number;
  business_id: string;
  pos_access_code: string | null;
}

interface StoreLocationSettingsProps {
  userRole: string;
}

const StoreLocationSettings = ({ userRole }: StoreLocationSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [businessId, setBusinessId] = useState<string>("");

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
    { value: "America/Chicago", label: "Central Time (CST/CDT)" },
    { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKST/AKDT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" }
  ];

  const isManager = userRole === "business_owner" || userRole === "manager" || userRole === "office";

  useEffect(() => {
    if (user) {
      fetchStores();
    }
  }, [user]);

  const fetchStores = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get user's business
      const { data: membership } = await supabase
        .from("user_business_memberships")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!membership) return;
      
      setBusinessId(membership.business_id);

      // Fetch stores
      const { data: storesData, error } = await supabase
        .from("stores")
        .select("*")
        .eq("business_id", membership.business_id)
        .order("name");

      if (error) throw error;
      setStores(storesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load store locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStore = () => {
    console.log("createStore called", { businessId });
    const newStore: Store = {
      id: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      timezone: "America/New_York",
      status: "active",
      tax_rate: 0.08875,
      business_id: businessId,
      pos_access_code: null
    };
    setEditingStore(newStore);
    setIsCreating(true);
    console.log("Store creation state set", { newStore, isCreating: true });
  };

  const saveStore = async () => {
    if (!editingStore || !businessId) return;

    setSaving(true);
    try {
      if (isCreating) {
        const { error } = await supabase
          .from("stores")
          .insert({
            name: editingStore.name,
            email: editingStore.email || null,
            phone: editingStore.phone || null,
            address: editingStore.address || null,
            timezone: editingStore.timezone,
            status: editingStore.status,
            tax_rate: editingStore.tax_rate,
            business_id: businessId
          });

        if (error) throw error;
        
        toast({
          title: "Store Created",
          description: "New store location has been added successfully.",
        });
      } else {
        const { error } = await supabase
          .from("stores")
          .update({
            name: editingStore.name,
            email: editingStore.email || null,
            phone: editingStore.phone || null,
            address: editingStore.address || null,
            timezone: editingStore.timezone,
            status: editingStore.status,
            tax_rate: editingStore.tax_rate
          })
          .eq("id", editingStore.id);

        if (error) throw error;
        
        toast({
          title: "Store Updated",
          description: "Store location has been updated successfully.",
        });
      }

      await fetchStores();
      setEditingStore(null);
      setIsCreating(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!confirm("Are you sure you want to delete this store location?")) return;

    try {
      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", storeId);

      if (error) throw error;

      toast({
        title: "Store Deleted",
        description: "Store location has been removed successfully.",
      });

      await fetchStores();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "POS access code copied to clipboard",
    });
  };

  const regenerateAccessCode = async (storeId: string) => {
    if (!confirm("Are you sure you want to regenerate the POS access code? This will invalidate the current code.")) return;

    try {
      // Call the function to generate a new code
      const { data, error } = await supabase.rpc('generate_store_access_code');
      if (error) throw error;

      // Update the store with the new code
      const { error: updateError } = await supabase
        .from("stores")
        .update({ pos_access_code: data })
        .eq("id", storeId);

      if (updateError) throw updateError;

      toast({
        title: "Access Code Regenerated",
        description: "New POS access code has been generated successfully.",
      });

      await fetchStores();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Store Locations</h3>
          <p className="text-sm text-muted-foreground">
            Manage your business locations and settings
          </p>
        </div>
        {isManager && (
          <Button 
            onClick={() => {
              console.log("Add Store button clicked");
              createStore();
            }} 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        )}
      </div>

      {/* Store List */}
      <div className="grid gap-4">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{store.name}</h4>
                    <Badge variant={store.status === "active" ? "default" : "secondary"}>
                      {store.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {store.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {store.address}
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {store.phone}
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {store.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Tax Rate: {(store.tax_rate * 100).toFixed(3)}%
                    </div>
                    {store.pos_access_code && (
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                          POS Code: {store.pos_access_code}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyAccessCode(store.pos_access_code!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {isManager && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => regenerateAccessCode(store.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isManager && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("Edit store button clicked", store);
                        setEditingStore(store);
                        setIsCreating(false);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("Delete store button clicked", store.id);
                        deleteStore(store.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {stores.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-semibold mb-2">No Store Locations</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first store location to get started
              </p>
                {isManager && (
                  <Button 
                    onClick={() => {
                      console.log("Create First Location button clicked");
                      createStore();
                    }} 
                    className="animate-fade-in"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Location
                  </Button>
                )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit/Create Store Modal */}
      {editingStore && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? "Create New Store" : "Edit Store Location"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={editingStore.name}
                  onChange={(e) => setEditingStore(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter store name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeStatus">Status</Label>
                <Select
                  value={editingStore.status}
                  onValueChange={(value) => setEditingStore(prev => prev ? { ...prev, status: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeEmail">Email</Label>
                <Input
                  id="storeEmail"
                  type="email"
                  value={editingStore.email || ""}
                  onChange={(e) => setEditingStore(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="store@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storePhone">Phone</Label>
                <Input
                  id="storePhone"
                  type="tel"
                  value={editingStore.phone || ""}
                  onChange={(e) => setEditingStore(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={editingStore.timezone || "America/New_York"}
                  onValueChange={(value) => setEditingStore(prev => prev ? { ...prev, timezone: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={editingStore.tax_rate}
                  onChange={(e) => setEditingStore(prev => prev ? { ...prev, tax_rate: parseFloat(e.target.value) || 0 } : null)}
                  placeholder="0.08875"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="storeAddress">Address</Label>
              <Textarea
                id="storeAddress"
                value={editingStore.address || ""}
                onChange={(e) => setEditingStore(prev => prev ? { ...prev, address: e.target.value } : null)}
                placeholder="123 Main St, City, State 12345"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  console.log("Save store button clicked", { editingStore, isCreating });
                  saveStore();
                }} 
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isCreating ? "Creating..." : "Saving..."}
                  </>
                ) : (
                  isCreating ? "Create Store" : "Save Changes"
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingStore(null);
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoreLocationSettings;