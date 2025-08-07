import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  CREATE_REORDER_REQUEST,
  Inventory,
  Mutation,
  MutationCreateReorderRequestArgs,
} from "@/graphql";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useState } from "react";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";
import { useMutation } from "@apollo/client";
import { cn } from "@/lib/utils.ts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar.tsx";

type Props = {
  item: Inventory;
  handleClose: () => void;
};

export const ReorderDialog = ({ handleClose, item }: Props) => {
  const [date, setDate] = useState<string>();
  const [quantity, setQuantity] = useState("");
  const [createRequest, { loading }] = useMutation<
    Mutation,
    MutationCreateReorderRequestArgs
  >(CREATE_REORDER_REQUEST);

  const handleSubmit = () => {
    if (!quantity || !date) {
      showError("Error", "Please fill all required fields!");
      return;
    }

    createRequest({
      variables: {
        input: {
          inventoryId: item.id,
          restock_by: date,
          quantity: parseInt(quantity),
        },
      },
    }).then(() => {
      showSuccess("Request for reorder sent to supplier!");
      handleClose();
    });
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reorder Stock - {item?.product?.name}</DialogTitle>
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
            <p className="text-sm">
              Supplier:{" "}
              <span
                className={cn(
                  "font-medium",
                  !item?.product?.supplier?.name ? "text-red-500" : "",
                )}
              >
                {item?.product?.supplier?.name ?? "ADD SUPPLIER FIRST"}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reorder quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Restock by</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(parseISO(date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date ? parseISO(date) : undefined}
                    onSelect={(date) =>
                      date && setDate(format(date, "yyyy-MM-dd"))
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {quantity && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                New Stock Level:{" "}
                <span className="font-medium">
                  {item?.quantity_on_hand + parseInt(quantity || "0")}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!item?.product?.supplier?.name}
              loading={loading}
            >
              Reorder Stock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
