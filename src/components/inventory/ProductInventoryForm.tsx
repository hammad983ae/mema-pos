import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_PRODUCT,
  GET_CATEGORIES,
  GET_SUPPLIERS,
  Inventory,
  Mutation,
  MutationCreateProductArgs,
  MutationUpdateProductArgs,
  Product,
  Query,
  UPDATE_PRODUCT,
} from "@/graphql";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";
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
  item?: Inventory | Product;
  showInventory?: boolean;
};

export const ProductInventoryForm = ({
  item,
  refetch,
  handleClose,
  showInventory = true,
}: Props) => {
  const [createProduct, { loading: creatingProduct }] = useMutation<
    Mutation,
    MutationCreateProductArgs
  >(CREATE_PRODUCT);
  const [updateProduct, { loading: updatingProduct }] = useMutation<
    Mutation,
    MutationUpdateProductArgs
  >(UPDATE_PRODUCT);
  const { data: suppliersData } = useQuery<Query>(GET_SUPPLIERS);
  const { data: categoriesData } = useQuery<Query>(GET_CATEGORIES);

  const [productForm, setProductForm] = useState({
    name: "",
    supplier: "",
    category: "",
    sku: "",
    barcode: "",
    price: "0",
    cost: "0",
    minimumPrice: "",
    description: "",
    image_url: "",
    low_stock_threshold: "10",
    max_stock_level: "100",
    initial_quantity: "0",
  });

  useEffect(() => {
    if (item) {
      if (item.__typename === "Product") {
        setProductForm({
          name: item?.name ?? "",
          supplier: item?.supplier?.id ?? null,
          category: item?.category?.id ?? null,
          sku: item?.sku ?? "",
          barcode: item?.barcode ?? "",
          price: item?.price?.toString() ?? "0",
          cost: item?.cost?.toString() ?? "0",
          minimumPrice: item?.minimum_price.toString() ?? "",
          description: item.description ?? "",
          image_url: item?.image_url ?? "",
          low_stock_threshold: "-",
          max_stock_level: "-",
          initial_quantity: "-",
        });
      } else {
        setProductForm({
          name: item?.product?.name ?? "",
          supplier: item?.product.supplier?.id ?? null,
          category: item?.product.category?.id ?? null,
          sku: item?.product.sku ?? "",
          barcode: item?.product.barcode ?? "",
          price: item?.product.price?.toString() ?? "0",
          cost: item?.product.cost?.toString() ?? "0",
          minimumPrice: item?.product.minimum_price.toString() ?? "",
          description: item?.product.description ?? "",
          image_url: item?.product.image_url ?? "",
          low_stock_threshold: item?.low_stock_threshold?.toString() ?? "10",
          max_stock_level: item?.max_stock_level?.toString() ?? "100",
          initial_quantity: item?.quantity_on_hand?.toString() ?? "0",
        });
      }
    }
  }, []);

  const handleSubmit = () => {
    const {
      name,
      sku,
      barcode,
      price,
      cost,
      minimumPrice,
      description,
      max_stock_level,
      initial_quantity,
      low_stock_threshold,
      supplier,
      category,
      image_url,
    } = productForm;

    if (!name || !sku || !category) {
      showError("Error", "Please fill required fields!");
      return;
    }

    const productInput = {
      name,
      sku,
      barcode,
      price: parseFloat(price),
      cost: parseFloat(cost),
      supplierId: supplier,
      categoryId: category,
      minimum_price: parseFloat(minimumPrice),
      description,
      is_active: true,
      image_url,
    };
    const inventoryInput = {
      quantity_on_hand: parseInt(initial_quantity),
      low_stock_threshold: parseInt(low_stock_threshold),
      max_stock_level: parseInt(max_stock_level),
    };

    const promise = item
      ? updateProduct({
          variables: {
            input: {
              id: item.__typename === "Product" ? item.id : item.product.id,
              ...productInput,
            },
            ...(item.__typename === "Inventory" && {
              inventory: { id: item.id, ...inventoryInput },
            }),
          },
        })
      : createProduct({
          variables: {
            input: productInput,
            inventory: inventoryInput,
          },
        });

    promise.then(() => {
      showSuccess(`Product ${!!item ? "updated" : "added"} successfully`);

      refetch();

      setProductForm({
        name: "",
        sku: "",
        supplier: "",
        category: "",
        barcode: "",
        price: "0",
        cost: "0",
        minimumPrice: "",
        description: "",
        image_url: "",
        low_stock_threshold: "10",
        max_stock_level: "100",
        initial_quantity: "0",
      });

      handleClose();
    });
  };

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{`${!!item ? "Edit" : "Add New"} Product`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Product name"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Product SKU"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Cost ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={productForm.cost}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    cost: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <LabelWithTooltip
                htmlFor="minimumPrice"
                tooltip="Sales Person Minimum - Sets the minimum price employees can sell this product for"
                required
              >
                SPM ($)
              </LabelWithTooltip>
              <Input
                id="minimumPrice"
                type="number"
                step="0.01"
                value={productForm.minimumPrice}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    minimumPrice: e.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            {showInventory ? (
              <div className="space-y-2">
                <Label>Initial Quantity</Label>
                <Input
                  type="number"
                  disabled={!!item}
                  value={productForm.initial_quantity}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      initial_quantity: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="space-y-2" />
            )}
          </div>

          {showInventory && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={productForm.low_stock_threshold}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      low_stock_threshold: e.target.value,
                    }))
                  }
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Stock Level</Label>
                <Input
                  type="number"
                  value={productForm.max_stock_level}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      max_stock_level: e.target.value,
                    }))
                  }
                  placeholder="100"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>

              <Select
                value={productForm.category}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      <p className={"text-muted-foreground"}>Choose category</p>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.getCategories?.length ? (
                    categoriesData.getCategories.map((category) => (
                      <SelectItem value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <NoData text={"No categories found"} />
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier *</Label>

              <Select
                value={productForm.supplier}
                onValueChange={(value) =>
                  setProductForm((prev) => ({ ...prev, supplier: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      <p className={"text-muted-foreground"}>Choose supplier</p>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {suppliersData?.getSuppliers?.length ? (
                    suppliersData.getSuppliers.map((supplier) => (
                      <SelectItem value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  ) : (
                    <NoData text={"No suppliers found"} />
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ImageUpload
            value={productForm.image_url}
            onChange={(url) =>
              setProductForm((prev) => ({ ...prev, image_url: url || "" }))
            }
            bucket="product-images"
            path="products/"
          />

          {/*<div className="grid grid-cols-2 gap-4">*/}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={productForm.description}
              onChange={(e) =>
                setProductForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Product description"
              rows={3}
            />
          </div>
          {/*</div>*/}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={creatingProduct || updatingProduct}
            >
              {`${!!item ? "Update" : "Add"} Product`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
