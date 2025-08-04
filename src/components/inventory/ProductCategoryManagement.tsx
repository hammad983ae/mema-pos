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
  Grid,
  Grid2X2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_PRODUCT_CATEGORY,
  CREATE_SUPPLIER,
  CreateProductCategoryInput,
  CreateSupplierInput,
  DELETE_PRODUCT_CATEGORY,
  DELETE_SUPPLIER,
  GET_CATEGORIES,
  GET_SUPPLIERS,
  Mutation,
  MutationCreateProductCategoryArgs,
  MutationCreateSupplierArgs,
  MutationDeleteProductCategoryArgs,
  MutationDeleteSupplierArgs,
  MutationUpdateProductCategoryArgs,
  MutationUpdateSupplierArgs,
  ProductCategory,
  Query,
  Supplier,
  SupplierStatus,
  UPDATE_PRODUCT_CATEGORY,
  UPDATE_SUPPLIER,
} from "@/graphql";
import { showSuccess } from "@/hooks/useToastMessages.tsx";
import { DeleteDialog } from "@/components/inventory/DeleteDialog.tsx";

export const ProductCategoryManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductCategory | null>(
    null,
  );
  const [showDelete, setShowDelete] = useState(false);
  const [formData, setFormData] = useState<CreateProductCategoryInput>({
    name: "",
    description: "",
    is_active: true,
  });
  const { data, loading, refetch } = useQuery<Query>(GET_CATEGORIES, {
    fetchPolicy: "network-only",
  });
  const [createCategory, { loading: creating }] = useMutation<
    Mutation,
    MutationCreateProductCategoryArgs
  >(CREATE_PRODUCT_CATEGORY);
  const [updateCategory, { loading: updating }] = useMutation<
    Mutation,
    MutationUpdateProductCategoryArgs
  >(UPDATE_PRODUCT_CATEGORY);
  const [deleteCategory, { loading: deleting }] = useMutation<
    Mutation,
    MutationDeleteProductCategoryArgs
  >(DELETE_PRODUCT_CATEGORY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promise = selectedItem
      ? updateCategory({
          variables: {
            input: {
              ...formData,
              id: selectedItem.id,
            },
          },
        })
      : createCategory({ variables: { input: formData } });

    promise.then(() => {
      showSuccess(
        `Category ${selectedItem ? "updated" : "created"} successfully`,
      );

      setIsDialogOpen(false);
      setSelectedItem(null);
      setFormData({
        name: "",
        description: "",
        is_active: true,
      });
      refetch();
    });
  };

  const handleEdit = (item: ProductCategory) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "secondary"}>
        {status ? "ACTIVE" : "INACTIVE"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
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
            <Grid className="h-5 w-5" />
            <span>Category Management</span>
          </CardTitle>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setSelectedItem(null);
                  setFormData({
                    name: "",
                    description: "",
                    is_active: true,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem ? "Edit Category" : "Add New Category"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
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
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={creating || updating}
                  >
                    {selectedItem ? "Update" : "Create"} Category
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
        {data?.getCategories.length === 0 ? (
          <div className="text-center py-8">
            <Grid2X2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Categories
            </h3>
            <p className="text-sm text-muted-foreground">
              Add your first category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.getCategories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                    </div>
                    {getStatusBadge(category.is_active)}
                  </div>

                  <p className={"text-sm text-muted-foreground"}>
                    {category.description}
                  </p>

                  <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleting}
                      onClick={() => {
                        setSelectedItem(category);
                        setShowDelete(true);
                      }}
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

      {showDelete && (
        <DeleteDialog
          title={"Delete Category"}
          loading={deleting}
          handleClose={() => {
            setSelectedItem(null);
            setShowDelete(false);
          }}
          handleDelete={() => {
            deleteCategory({ variables: { id: selectedItem.id } }).then(() => {
              showSuccess("Category deleted successfully");
              refetch();
            });
          }}
        />
      )}
    </Card>
  );
};
