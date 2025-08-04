import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/back-button";
import { Loader2, Plus, RefreshCw, Save, Store, User } from "lucide-react";
import {
  CREATE_STORE,
  GET_STORES,
  Mutation,
  MutationCreateStoreArgs,
  Query,
  StoreStatus,
  SubscriptionPlan,
  UserRole,
} from "@/graphql";
import { useMutation, useQuery } from "@apollo/client";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";

const StoreManagement = () => {
  const { user, business } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newStore, setNewStore] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    timezone: "America/New_York",
    status: StoreStatus.Active,
    tax_rate: "",
  });
  const { data, loading, refetch } = useQuery<Query>(GET_STORES);
  const [createStore, { loading: creating }] = useMutation<
    Mutation,
    MutationCreateStoreArgs
  >(CREATE_STORE);

  // Form states for each store user
  const [userForms, setUserForms] = useState<
    Record<string, { username: string; pin: string }>
  >({});

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
    { value: "America/Chicago", label: "Central Time (CST/CDT)" },
    { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKST/AKDT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  ];

  const getStoreLimit = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.Starter:
        return 2;
      case SubscriptionPlan.Professional:
        return 5;
      case SubscriptionPlan.Enterprise:
        return -1; // Unlimited
      default:
        return 1;
    }
  };

  useEffect(() => {
    if (
      !(
        user.role === UserRole.BusinessOwner ||
        user.role === UserRole.Manager ||
        user.role === UserRole.Office
      )
    ) {
      showError(
        "Access Denied. You don't have permission to manage store settings",
      );
      navigate("/dashboard");
      return;
    }
  }, [user]);

  const updateUserCredentials = async (storeId: string, userId: string) => {
    const key = `${storeId}-${userId}`;
    const formData = userForms[key];

    if (!formData) return;

    try {
      setSaving(key);

      // Update username
      if (
        formData.username !==
        data?.getStores
          ?.find((store) => store.id === storeId)
          ?.users?.find((u) => u.id === userId)?.username
      ) {
        const { error: usernameError } = await supabase
          .from("profiles")
          .update({ username: formData.username })
          .eq("user_id", userId);

        if (usernameError) {
          throw new Error(
            `Failed to update username: ${usernameError.message}`,
          );
        }
      }

      // Update PIN if changed
      if (
        formData.pin &&
        formData.pin !==
          data?.getStores
            ?.find((store) => store.id === storeId)
            ?.users?.find((u) => u.id === userId)?.pos_pin
      ) {
        if (!/^\d{4,6}$/.test(formData.pin)) {
          throw new Error("PIN must be 4-6 digits");
        }

        const { error: pinError } = await supabase.functions.invoke(
          "update-pos-pin",
          {
            body: {
              newPin: formData.pin,
              targetUserId: userId,
            },
          },
        );

        if (pinError) {
          throw new Error(`Failed to update PIN: ${pinError.message}`);
        }
      }

      toast({
        title: "Success",
        description: "User credentials updated successfully",
      });

      // Refresh data
      await refetch();
    } catch (error: any) {
      console.error("Error updating credentials:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update credentials",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleFormChange = (
    storeId: string,
    userId: string,
    field: "username" | "pin",
    value: string,
  ) => {
    const key = `${storeId}-${userId}`;
    setUserForms((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleCreate = async () => {
    // Check subscription limits
    const storeLimit = getStoreLimit(business.subscription_plan);
    if (storeLimit !== -1 && data?.getStores?.length >= storeLimit) {
      showError(
        `Store Limit Reached. Your ${business.subscription_plan} plan allows up to ${storeLimit} store${storeLimit > 1 ? "s" : ""}. Upgrade your plan to add more stores.`,
      );
      return;
    }

    if (!newStore.name.trim()) {
      showError("Store name is required");
      return;
    }

    createStore({
      variables: {
        input: {
          name: newStore.name,
          email: newStore.email || null,
          phone: newStore.phone || null,
          address: newStore.address || null,
          timezone: newStore.timezone,
          status: newStore.status,
          tax_rate: parseFloat(newStore.tax_rate),
        },
      },
    }).then(() => {
      showSuccess("Store created successfully");
      setNewStore({
        name: "",
        email: "",
        phone: "",
        address: "",
        timezone: "America/New_York",
        status: StoreStatus.Active,
        tax_rate: "",
      });
      setShowCreateDialog(false);

      refetch();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading store settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <BackButton />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Store Management</h1>
                <p className="text-muted-foreground">
                  Manage POS settings and user credentials for each store
                </p>
              </div>
            </div>
            {(user.role === UserRole.BusinessOwner ||
              user.role === UserRole.Manager ||
              user.role === UserRole.Office) && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Store
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Store</DialogTitle>
                      <DialogDescription>
                        Add a new store location to your business
                        {business && (
                          <span className="block mt-1 text-sm">
                            Plan: {business.subscription_plan}
                            {getStoreLimit(business.subscription_plan) !== -1 &&
                              ` (${data?.getStores?.length}/${getStoreLimit(business.subscription_plan)} stores used)`}
                          </span>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="storeName">Store Name *</Label>
                          <Input
                            id="storeName"
                            value={newStore.name}
                            onChange={(e) =>
                              setNewStore((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Enter store name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="storeStatus">Status</Label>
                          <Select
                            value={newStore.status}
                            onValueChange={(value) =>
                              setNewStore((prev) => ({
                                ...prev,
                                status: value as StoreStatus,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={StoreStatus.Active}>
                                Active
                              </SelectItem>
                              <SelectItem value={StoreStatus.Inactive}>
                                Inactive
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="storeEmail">Email</Label>
                          <Input
                            id="storeEmail"
                            type="email"
                            value={newStore.email}
                            onChange={(e) =>
                              setNewStore((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="store@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="storePhone">Phone</Label>
                          <Input
                            id="storePhone"
                            type="tel"
                            value={newStore.phone}
                            onChange={(e) =>
                              setNewStore((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Select
                            value={newStore.timezone}
                            onValueChange={(value) =>
                              setNewStore((prev) => ({
                                ...prev,
                                timezone: value,
                              }))
                            }
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
                            value={newStore.tax_rate}
                            onChange={(e) =>
                              setNewStore((prev) => ({
                                ...prev,
                                tax_rate: e.target.value,
                              }))
                            }
                            placeholder="0.08875"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="storeAddress">Address</Label>
                        <Textarea
                          id="storeAddress"
                          value={newStore.address}
                          onChange={(e) =>
                            setNewStore((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder="123 Main St, City, State 12345"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                          disabled={saving === "create"}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreate}
                          loading={creating}
                          disabled={!newStore.name.trim()}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Create Store
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {data?.getStores?.map((store) => (
            <Card key={store.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {store.name}
                      <Badge
                        variant={
                          store.status === StoreStatus.Active
                            ? "default"
                            : "secondary"
                        }
                      >
                        {store.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {store.address || "No address set"}
                    </CardDescription>
                    {store.email && (
                      <p className="text-sm text-muted-foreground">
                        {store.email}
                      </p>
                    )}
                    {store.phone && (
                      <p className="text-sm text-muted-foreground">
                        {store.phone}
                      </p>
                    )}
                  </div>
                  {/*<Badge variant="outline" className="font-mono">*/}
                  {/*  Code: store.pos_access_code*/}
                  {/*</Badge>*/}
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Employee POS Credentials
                  </h4>

                  {!store.users?.length ? (
                    <p className="text-muted-foreground text-sm">
                      No employees found
                    </p>
                  ) : (
                    <div className="grid gap-4">
                      {store.users?.map((user) => {
                        const key = `${store.id}-${user.id}`;
                        const formData = userForms[key] || {
                          username: "",
                          pin: "",
                        };
                        const isChanged =
                          formData.username !== user.username ||
                          (formData.pin && formData.pin !== user.pos_pin);

                        return (
                          <Card key={user.id} className="p-4 bg-muted/20">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium">{user.full_name}</h5>
                              {isChanged && (
                                <Badge variant="secondary" className="text-xs">
                                  Changes pending
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`username-${key}`}>
                                  POS Username
                                </Label>
                                <Input
                                  id={`username-${key}`}
                                  placeholder="Enter username"
                                  value={formData.username}
                                  onChange={(e) =>
                                    handleFormChange(
                                      store.id,
                                      user.id,
                                      "username",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`pin-${key}`}>
                                  POS PIN (4-6 digits)
                                </Label>
                                <Input
                                  id={`pin-${key}`}
                                  type="password"
                                  placeholder="Enter PIN"
                                  value={formData.pin}
                                  onChange={(e) =>
                                    handleFormChange(
                                      store.id,
                                      user.id,
                                      "pin",
                                      e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 6),
                                    )
                                  }
                                  maxLength={6}
                                />
                              </div>

                              <div className="flex items-end">
                                <Button
                                  onClick={() =>
                                    updateUserCredentials(store.id, user.id)
                                  }
                                  disabled={!isChanged || saving === key}
                                  size="sm"
                                  className="w-full"
                                >
                                  {saving === key ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {!data?.getStores?.length && (
            <Card>
              <CardContent className="py-8 text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No stores found</h3>
                <p className="text-muted-foreground">
                  Create your first store to manage POS settings
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreManagement;
