import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DELETE_RECEIPT,
  GET_USERS_BY_BUSINESS,
  Mutation,
  MutationDeleteReceiptArgs,
  MutationUpdateReceiptArgs,
  Query,
  Receipt,
  ReceiptStatus,
  UPDATE_RECEIPT,
} from "@/graphql";
import { DeleteDialog } from "@/components/inventory/DeleteDialog.tsx";
import { useMutation, useQuery } from "@apollo/client";
import { showSuccess } from "@/hooks/useToastMessages.tsx";

interface Employee {
  user_id: string;
  full_name: string;
  email: string;
}

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Receipt | null;
  onOrderUpdated: () => void;
}

export const EditOrderModal = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
}: EditOrderModalProps) => {
  const { user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    customer_id: "",
    total: 0,
    notes: "",
    status: ReceiptStatus.Completed,
  });
  const [updateReceipt, { loading: updating }] = useMutation<
    Mutation,
    MutationUpdateReceiptArgs
  >(UPDATE_RECEIPT);
  const [deleteReceipt, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteReceiptArgs
  >(DELETE_RECEIPT);
  const { data } = useQuery<Query>(GET_USERS_BY_BUSINESS);

  useEffect(() => {
    if (isOpen) {
      if (order) {
        setFormData({
          user_id: order.employees[0]?.user?.id ?? "",
          customer_id: order.customer_id || "",
          total: Number(order.grand_total),
          notes: order.notes || "",
          status: order.status,
        });
      }
    }
  }, [isOpen, order]);

  const handleSave = async () => {
    if (!order || !user) return;

    updateReceipt({
      variables: {
        input: {
          id: order.id,
          ...(formData.user_id && {
            employees: [{ user_id: formData.user_id }],
          }),
          grand_total: formData.total.toString(),
          notes: formData.notes,
          status: formData.status,
        },
      },
    }).then(() => {
      showSuccess("Order updated successfully");

      onOrderUpdated();
      onClose();
    });
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Order - {order.receipt_number}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ← Back
            </Button>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Info */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Order Number:</span>
                    <div>{order.receipt_number}</div>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <div>{new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="font-medium">Customer:</span>
                    <div>
                      {order.customers
                        ? `${order.customers.first_name} ${order.customers.last_name}`
                        : "Walk-in Customer"}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Payment Methods:</span>
                    {order.payment_methods.map((method) => (
                      <div className={"flex justify-between gap-[12px]"}>
                        <div className="capitalize">
                          {order.payment_methods[0].type}
                        </div>
                        <div>${order.payment_methods[0].amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Form */}
            <div className="space-y-4">
              <div>
                <Label>Assigned Salesperson</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, user_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select salesperson" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.getUsersByBusiness.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name} ({employee.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Total Amount</Label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as ReceiptStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReceiptStatus.Completed}>
                      Completed
                    </SelectItem>
                    <SelectItem value={ReceiptStatus.Pending}>
                      Pending
                    </SelectItem>
                    <SelectItem value={ReceiptStatus.Cancelled}>
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Order
              </Button>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={updating}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showDelete && (
        <DeleteDialog
          title={"Delete Order"}
          loading={deleting}
          handleClose={() => setShowDelete(false)}
          handleDelete={() =>
            deleteReceipt({
              variables: { id: order.id },
            }).then(() => {
              onClose();
              onOrderUpdated();
            })
          }
        />
      )}
    </>
  );
};
