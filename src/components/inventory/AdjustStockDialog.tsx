import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  CREATE_INVENTORY_MOVEMENT,
  GET_INVENTORY_STATS,
  Inventory,
  MovementType,
  Mutation,
  MutationCreateInventoryMovementArgs,
  MutationUpdateInventoryArgs,
  UPDATE_INVENTORY,
} from "@/graphql";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useState } from "react";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";
import { useMutation } from "@apollo/client";
import { useAuth } from "@/hooks/useAuth.tsx";

type Props = {
  item: Inventory;
  handleClose: () => void;
  onSuccess?: () => void;
};

export const AdjustStockDialog = ({ handleClose, onSuccess, item }: Props) => {
  const { user } = useAuth();
  const [updateInventory, { loading: updatingInventory }] = useMutation<
    Mutation,
    MutationUpdateInventoryArgs
  >(UPDATE_INVENTORY);
  const [createMovement, { loading: creatingMovement }] = useMutation<
    Mutation,
    MutationCreateInventoryMovementArgs
  >(CREATE_INVENTORY_MOVEMENT);

  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment_type: MovementType.Adjustment,
    quantity_change: "",
    notes: "",
  });

  const movementTypes = [
    { value: MovementType.Adjustment, label: "Manual Adjustment" },
    { value: MovementType.Sale, label: "Sale" },
    { value: MovementType.Purchase, label: "Purchase" },
    { value: MovementType.Return, label: "Return" },
    { value: MovementType.Damage, label: "Damage/Loss" },
    { value: MovementType.TransferIn, label: "Store Transfer In" },
    { value: MovementType.TransferOut, label: "Store Transfer Out" },
  ];

  const handleStockAdjustment = () => {
    const quantityChange = parseInt(adjustmentForm.quantity_change);
    const newQuantity = item.quantity_on_hand + quantityChange;

    if (newQuantity < 0) {
      showError("Adjustment would result in negative stock");
      return;
    }

    updateInventory({
      variables: {
        input: {
          id: item.id,
          quantity_on_hand: newQuantity,
          last_counted_at: new Date().toISOString(),
        },
      },
    }).then(() => {
      createMovement({
        variables: {
          input: {
            storeId: item.store.id,
            productId: item.product.id,
            movement_type: adjustmentForm.adjustment_type as MovementType,
            quantity_change: quantityChange,
            previous_quantity: item.quantity_on_hand,
            new_quantity: newQuantity,
            notes: adjustmentForm.notes || "",
            createdById: user?.id,
          },
        },
        refetchQueries: [{ query: GET_INVENTORY_STATS }],
      }).then(() => {
        setAdjustmentForm({
          adjustment_type: MovementType.Adjustment,
          quantity_change: "",
          notes: "",
        });

        onSuccess?.();

        handleClose();
        showSuccess("Stock adjustment recorded successfully");
      });
    });
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock - {item?.product?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              Current Stock:{" "}
              <span className="font-medium">{item?.quantity_on_hand}</span>
            </p>
            <p className="text-sm">
              Low Stock Threshold:{" "}
              <span className="font-medium">{item?.low_stock_threshold}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select
                value={adjustmentForm.adjustment_type}
                onValueChange={(value) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    adjustment_type: value as MovementType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity Change</Label>
              <Input
                type="number"
                value={adjustmentForm.quantity_change}
                onChange={(e) =>
                  setAdjustmentForm((prev) => ({
                    ...prev,
                    quantity_change: e.target.value,
                  }))
                }
                placeholder="Enter +/- amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={adjustmentForm.notes}
              onChange={(e) =>
                setAdjustmentForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Reason for adjustment"
              rows={3}
            />
          </div>

          {adjustmentForm.quantity_change && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                New Stock Level:{" "}
                <span className="font-medium">
                  {item?.quantity_on_hand +
                    parseInt(adjustmentForm.quantity_change || "0")}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStockAdjustment}
              loading={creatingMovement || updatingInventory}
            >
              Update Stock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
