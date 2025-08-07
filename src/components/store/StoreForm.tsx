import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  CREATE_STORE,
  Mutation,
  MutationCreateStoreArgs,
  MutationUpdateStoreArgs,
  Store,
  StoreLocation,
  SubscriptionPlan,
  UPDATE_STORE,
} from "@/graphql";
import { Textarea } from "@/components/ui/textarea.tsx";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";
import { useState } from "react";
import { useMutation } from "@apollo/client";
import { useAuth } from "@/hooks/useAuth.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import NoData from "@/components/NoData.tsx";

type Props = {
  refetch: () => void;
  handleClose: () => void;
  storeCount: number;
  locations: StoreLocation[];
  selectedItem: Store | null;
};

export const StoreForm = ({
  refetch,
  storeCount,
  locations,
  selectedItem,
  handleClose,
}: Props) => {
  const { business } = useAuth();
  const [formData, setFormData] = useState({
    name: selectedItem?.name || "",
    email: selectedItem?.email || "",
    phone: selectedItem?.phone || "",
    address: selectedItem?.address || "",
    tax_rate: selectedItem?.tax_rate?.toString() || "",
    location: selectedItem?.location?.id || "",
    pin: selectedItem?.pin || "",
  });
  const [createStore, { loading: creating }] = useMutation<
    Mutation,
    MutationCreateStoreArgs
  >(CREATE_STORE);
  const [updateStore, { loading: updating }] = useMutation<
    Mutation,
    MutationUpdateStoreArgs
  >(UPDATE_STORE);

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

  const handleCreate = async () => {
    // Check subscription limits
    const storeLimit = getStoreLimit(business.subscription_plan);
    if (storeLimit !== -1 && storeCount >= storeLimit) {
      showError(
        `Store Limit Reached. Your ${business.subscription_plan} plan allows up to ${storeLimit} store${storeLimit > 1 ? "s" : ""}. Upgrade your plan to add more stores.`,
      );
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.address ||
      !formData.pin ||
      formData.pin?.length !== 6
    ) {
      showError("Error", "Please fill required fields!");
      return;
    }

    const input = {
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      tax_rate: parseFloat(formData.tax_rate),
      pin: formData.pin || null,
      locationId: formData.location || null,
    };

    const promise = selectedItem
      ? updateStore({
          variables: {
            input: {
              ...input,
              id: selectedItem.id,
            },
          },
        })
      : createStore({ variables: { input } });

    promise.then(() => {
      showSuccess(`Store ${selectedItem ? "updated" : "created"} successfully`);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        tax_rate: "",
        location: "",
        pin: "",
      });

      handleClose();

      refetch();
    });
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Store</DialogTitle>
          <DialogDescription>
            Add a new store to your business
            {business && (
              <span className="block mt-1 text-sm">
                Plan: {business.subscription_plan}
                {getStoreLimit(business.subscription_plan) !== -1 &&
                  ` (${storeCount}/${getStoreLimit(business.subscription_plan)} stores used)`}
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
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter store name"
              />
            </div>

            <div className="space-y-2">
              <Label>Location *</Label>

              <Select
                value={formData.location}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, location: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      <p className={"text-muted-foreground"}>Choose location</p>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {locations?.length ? (
                    locations.map((location) => (
                      <SelectItem value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))
                  ) : (
                    <NoData text={"No locations found"} />
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeEmail">Email</Label>
              <Input
                id="storeEmail"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="store@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Pin *</Label>
              <Input
                id={"pin"}
                maxLength={6}
                minLength={6}
                value={formData.pin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pin: e.target.value,
                  }))
                }
                placeholder="Enter 6 digit pin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storePhone">Phone</Label>
              <Input
                id="storePhone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.001"
                min="0"
                max="1"
                value={formData.tax_rate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tax_rate: e.target.value,
                  }))
                }
                placeholder="0.08875"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress">Address *</Label>
            <Textarea
              id="storeAddress"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              placeholder="123 Main St, City, State 12345"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={creating || updating}
              disabled={
                !formData.name.trim() || !formData.pin || !formData.address
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {selectedItem ? "Update" : "Create"} Store
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
