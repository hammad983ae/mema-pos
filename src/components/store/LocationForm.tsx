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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  CREATE_STORE_LOCATION,
  Mutation,
  MutationCreateStoreLocationArgs,
  MutationUpdateStoreLocationArgs,
  StoreLocation,
  UPDATE_STORE_LOCATION,
} from "@/graphql";
import { Textarea } from "@/components/ui/textarea.tsx";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";
import { useState } from "react";
import { useMutation } from "@apollo/client";

type Props = {
  refetch: () => void;
  handleClose: () => void;
  selectedItem: StoreLocation | null;
};

export const LocationForm = ({ selectedItem, handleClose, refetch }: Props) => {
  const [formData, setFormData] = useState({
    name: selectedItem?.name || "",
    address: selectedItem?.address || "",
    timezone: selectedItem?.timezone || "America/New_York",
    pin: selectedItem?.pin || "",
  });
  const [createLocation, { loading: creating }] = useMutation<
    Mutation,
    MutationCreateStoreLocationArgs
  >(CREATE_STORE_LOCATION);
  const [updateLocation, { loading: updating }] = useMutation<
    Mutation,
    MutationUpdateStoreLocationArgs
  >(UPDATE_STORE_LOCATION);

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (EST/EDT)" },
    { value: "America/Chicago", label: "Central Time (CST/CDT)" },
    { value: "America/Denver", label: "Mountain Time (MST/MDT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PST/PDT)" },
    { value: "America/Anchorage", label: "Alaska Time (AKST/AKDT)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  ];

  const handleCreate = async () => {
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
      name: formData.name || null,
      address: formData.address || null,
      timezone: formData.timezone || null,
      pin: formData.pin || null,
    };

    const promise = selectedItem
      ? updateLocation({
          variables: {
            input: {
              ...input,
              id: selectedItem.id,
            },
          },
        })
      : createLocation({ variables: { input } });

    promise.then(() => {
      showSuccess(
        `Location ${selectedItem ? "updated" : "created"} successfully`,
      );
      setFormData({
        name: "",
        address: "",
        timezone: "America/New_York",
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
          <DialogTitle>Create New Location</DialogTitle>
          <DialogDescription>
            Add a new location to your business. Each location can have multiple
            stores.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Enter location name"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData((prev) => ({
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
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
              disabled={!formData.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {selectedItem ? "Update" : "Create"} Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
