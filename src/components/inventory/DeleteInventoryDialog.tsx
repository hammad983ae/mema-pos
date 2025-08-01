import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Inventory } from "@/graphql";

type Props = {
  item: Inventory;
  handleClose: () => void;
  handleDelete: () => void;
};

export const DeleteInventoryDialog = ({
  handleClose,
  handleDelete,
  item,
}: Props) => {
  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Inventory</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              Are you sure you want to delete this product from store inventory?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This action cannot be undone.
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">{item.product.name}</h4>
            <p className="text-sm text-muted-foreground">
              SKU: {item.product.sku}
            </p>
            <p className="text-sm text-muted-foreground">
              Current Stock: {item.quantity_on_hand}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
