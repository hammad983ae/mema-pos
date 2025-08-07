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
import { BackButton } from "@/components/ui/back-button";
import {
  Edit,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Store,
  Trash2,
  User,
} from "lucide-react";
import {
  GET_LOCATIONS,
  GET_STORES,
  Query,
  UserRole,
  Store as TStore,
  StoreLocation,
  DELETE_STORE,
  Mutation,
  MutationDeleteStoreArgs,
  DELETE_STORE_LOCATION,
  MutationDeleteStoreLocationArgs,
} from "@/graphql";
import { useMutation, useQuery } from "@apollo/client";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { StoreForm } from "@/components/store/StoreForm.tsx";
import { LocationForm } from "@/components/store/LocationForm.tsx";
import { DeleteDialog } from "@/components/inventory/DeleteDialog.tsx";

const StoreManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    TStore | StoreLocation | null
  >(null);
  const {
    data: storesData,
    loading: storesLoading,
    refetch: refetchStores,
  } = useQuery<Query>(GET_STORES);
  const {
    data: locationsData,
    loading: locationsLoading,
    refetch: refetchLocations,
  } = useQuery<Query>(GET_LOCATIONS);

  useEffect(() => {
    if (
      !(
        user.role === UserRole.BusinessOwner ||
        user.role === UserRole.Manager ||
        user.role === UserRole.Office
      )
    ) {
      showError(
        "Access Denied",
        "You don't have permission to manage store settings",
      );
      navigate("/dashboard");
      return;
    }
  }, [user]);

  if (storesLoading || locationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
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
          </div>

          <div className={"mt-4"}>
            <Tabs defaultValue="locations" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="stores">Stores</TabsTrigger>
              </TabsList>

              <TabsContent value={"locations"}>
                <div className="space-y-6">
                  <div className={"flex justify-end"}>
                    {(user.role === UserRole.BusinessOwner ||
                      user.role === UserRole.Manager ||
                      user.role === UserRole.Office) && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => refetchLocations()}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>

                        <Button onClick={() => setShowLocationForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Location
                        </Button>

                        {showLocationForm && (
                          <LocationForm
                            selectedItem={selectedItem as StoreLocation}
                            handleClose={() => {
                              setSelectedItem(null);
                              setShowLocationForm(false);
                            }}
                            refetch={() => refetchLocations()}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {locationsData?.getLocations?.map((location) => (
                    <LocationItem
                      key={location.id}
                      location={location}
                      refetch={() => refetchLocations()}
                      handleEdit={() => {
                        setSelectedItem(location);
                        setShowLocationForm(true);
                      }}
                    />
                  ))}

                  {!storesData?.getStores?.length && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No stores found
                        </h3>
                        <p className="text-muted-foreground">
                          Create your first store to manage POS settings
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value={"stores"}>
                <div className="space-y-6">
                  <div className={"flex justify-end"}>
                    {(user.role === UserRole.BusinessOwner ||
                      user.role === UserRole.Manager ||
                      user.role === UserRole.Office) && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => refetchStores()}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>

                        <Button onClick={() => setShowStoreForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Store
                        </Button>

                        {showStoreForm && (
                          <StoreForm
                            refetch={() => refetchStores()}
                            locations={locationsData?.getLocations}
                            storeCount={storesData?.getStores?.length}
                            selectedItem={selectedItem as TStore}
                            handleClose={() => {
                              setSelectedItem(null);
                              setShowStoreForm(false);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {storesData?.getStores?.map((store) => (
                    <StoreItem
                      key={store.id}
                      store={store}
                      refetch={() => refetchStores()}
                      handleEdit={() => {
                        setSelectedItem(store);
                        setShowStoreForm(true);
                      }}
                    />
                  ))}

                  {!storesData?.getStores?.length && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          No stores found
                        </h3>
                        <p className="text-muted-foreground">
                          Create your first store to manage POS settings
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreManagement;

const StoreItem = ({
  store,
  refetch,
  handleEdit,
}: {
  store: TStore;
  refetch: () => void;
  handleEdit: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [userForms, setUserForms] = useState<
    Record<string, { username: string; pin: string }>
  >({});
  const [deleteStore, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteStoreArgs
  >(DELETE_STORE);

  const updateUserCredentials = async (storeId: string, userId: string) => {
    const key = `${storeId}-${userId}`;
    const formData = userForms[key];

    if (!formData) return;

    try {
      setLoading(true);

      // Update username
      if (
        formData.username !==
        store?.users?.find((u) => u.id === userId)?.username
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
        formData.pin !== store?.users?.find((u) => u.id === userId)?.pos_pin
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

      showSuccess("User credentials updated successfully");

      // Refresh data
      await refetch();
    } catch (error: any) {
      console.error("Error updating credentials:", error);
      showError("Error", error.message || "Failed to update credentials");
    } finally {
      setLoading(false);
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

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {store.name}
              <Badge variant={store.is_active ? "default" : "secondary"}>
                {store.is_active ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {store.address || "No address set"}
            </CardDescription>
            {store.email && (
              <p className="text-sm text-muted-foreground">{store.email}</p>
            )}
            {store.phone && (
              <p className="text-sm text-muted-foreground">{store.phone}</p>
            )}
          </div>

          <div className={"flex flex-col gap-2"}>
            <div className="flex items-center justify-end space-x-1">
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setShowDelete(true);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Badge variant="outline" className="font-mono">
              Code: {store.pin ?? "-"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Employee POS Credentials
          </h4>

          {!store.users?.length ? (
            <p className="text-muted-foreground text-sm">No employees found</p>
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
                        <Label htmlFor={`username-${key}`}>POS Username</Label>
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
                              e.target.value.replace(/\D/g, "").slice(0, 6),
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
                          disabled={!isChanged}
                          loading={loading}
                          size="sm"
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save
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

      {showDelete && (
        <DeleteDialog
          title={"Delete Store"}
          description={
            "Deleting this store will delete all inventories associated with it."
          }
          loading={deleting}
          handleClose={() => setShowDelete(false)}
          handleDelete={() =>
            deleteStore({ variables: { id: store.id } }).then(() => {
              setShowDelete(false);
              showSuccess("Store deleted successfully");
              refetch();
            })
          }
        />
      )}
    </Card>
  );
};

const LocationItem = ({
  location,
  refetch,
  handleEdit,
}: {
  location: StoreLocation;
  refetch: () => void;
  handleEdit: () => void;
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const [deleteLocaton, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteStoreLocationArgs
  >(DELETE_STORE_LOCATION);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {location.name}
              <Badge variant={location.is_active ? "default" : "secondary"}>
                {location.is_active ? "ACTIVE" : "INACTIVE"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {location.address || "No address set"}
            </CardDescription>

            <p className="text-sm text-muted-foreground">
              {location.storesCount} store(s) in this location
            </p>
          </div>

          <div className={"flex flex-col gap-2"}>
            <div className="flex items-center justify-end space-x-1">
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Badge variant="outline" className="font-mono">
              Code: {location.pin ?? "-"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {showDelete && (
        <DeleteDialog
          title={"Delete Location"}
          loading={deleting}
          handleClose={() => setShowDelete(false)}
          handleDelete={() =>
            deleteLocaton({ variables: { id: location.id } }).then(() => {
              setShowDelete(false);
              showSuccess("Location deleted successfully");
              refetch();
            })
          }
        />
      )}
    </Card>
  );
};
