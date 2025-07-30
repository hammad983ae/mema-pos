import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_SUPPLIER,
  CreateSupplierInput,
  DELETE_SUPPLIER,
  GET_SUPPLIERS,
  Mutation,
  MutationCreateSupplierArgs,
  MutationDeleteSupplierArgs,
  MutationUpdateSupplierArgs,
  Query,
  Supplier,
  SupplierStatus,
  UPDATE_SUPPLIER,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";

export const SupplierManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<CreateSupplierInput>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    status: SupplierStatus.Active,
  });
  const { toast } = useToast();
  const { data, loading, refetch } = useQuery<Query>(GET_SUPPLIERS);
  const [createSupplier, { loading: creating }] = useMutation<
    Mutation,
    MutationCreateSupplierArgs
  >(CREATE_SUPPLIER);
  const [updateSupplier, { loading: updating }] = useMutation<
    Mutation,
    MutationUpdateSupplierArgs
  >(UPDATE_SUPPLIER);
  const [deleteSupplier, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteSupplierArgs
  >(DELETE_SUPPLIER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promise = editingSupplier
      ? updateSupplier({
          variables: {
            input: {
              ...formData,
              id: editingSupplier.id,
            },
          },
        })
      : createSupplier({ variables: { input: formData } });

    promise.then(() => {
      showSuccess(
        "Success",
        `Supplier ${editingSupplier ? "updated" : "created"} successfully`,
      );

      setIsDialogOpen(false);
      setEditingSupplier(null);
      setFormData({
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        status: SupplierStatus.Active,
      });
      refetch();
    });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
      status: supplier.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    deleteSupplier({ variables: { id: supplierId } }).then(() => {
      showSuccess("Success", "Supplier deleted successfully");
      refetch();
    });
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge
        variant={status === SupplierStatus.Active ? "default" : "secondary"}
      >
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Supplier Management</span>
          </CardTitle>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingSupplier(null);
                  setFormData({
                    name: "",
                    contact_person: "",
                    email: "",
                    phone: "",
                    address: "",
                    notes: "",
                    status: SupplierStatus.Active,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Supplier Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact_person: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
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
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SupplierStatus.Active}>
                        Active
                      </SelectItem>
                      <SelectItem value={SupplierStatus.Inactive}>
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={creating || updating}
                  >
                    {editingSupplier ? "Update" : "Create"} Supplier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {data?.getSuppliers.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Suppliers
            </h3>
            <p className="text-sm text-muted-foreground">
              Add your first supplier to get started with purchase orders
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.getSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      {supplier.contact_person && (
                        <p className="text-sm text-muted-foreground">
                          {supplier.contact_person}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(supplier.status)}
                  </div>

                  <div className="space-y-2">
                    {supplier.email && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}

                    {supplier.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}

                    {supplier.address && (
                      <div className="flex items-start space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground line-clamp-2">
                          {supplier.address}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(supplier.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
